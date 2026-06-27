import https from "node:https";

const PAYPAL_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const body = "grant_type=client_credentials";
  const result = await httpsPost(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body
  );

  const data = JSON.parse(result);
  return data.access_token;
}

function httpsPost(url: string, headers: Record<string, string>, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Length": Buffer.byteLength(body),
        ...headers,
      },
      agent: new https.Agent({ keepAlive: false }),
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(url: string, accessToken: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      agent: new https.Agent({ keepAlive: false }),
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
    });

    req.on("error", reject);
    req.end();
  });
}

export async function getSubscriptionDetails(subscriptionId: string) {
  const token = await getAccessToken();
  const raw = await httpsGet(
    `${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`,
    token
  );
  return JSON.parse(raw);
}

export async function verifyWebhookSignature(
  headers: Record<string, string>,
  body: string
): Promise<boolean> {
  const token = await getAccessToken();

  const payload = JSON.stringify({
    auth_algo: headers["paypal-auth-algo"],
    cert_url: headers["paypal-cert-url"],
    transmission_id: headers["paypal-transmission-id"],
    transmission_sig: headers["paypal-transmission-sig"],
    transmission_time: headers["paypal-transmission-time"],
    webhook_id: process.env.PAYPAL_WEBHOOK_ID,
    webhook_event: JSON.parse(body),
  });

  const result = await httpsPost(
    `${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`,
    {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    payload
  );

  const data = JSON.parse(result);
  return data.verification_status === "SUCCESS";
}

export const PAYPAL_PLAN_IDS: Record<string, string> = {
  pro: process.env.PAYPAL_PLAN_ID_PRO ?? "",
  business: process.env.PAYPAL_PLAN_ID_BUSINESS ?? "",
};
