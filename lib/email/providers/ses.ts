import { BaseEmailProvider } from "./base";
import type { OutboundEmailMessage, SendResult } from "../types";

// Minimal AWS SigV4 signer using Web Crypto (available in Node.js 15+ and Edge)
async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data.buffer as ArrayBuffer);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const rawKey = key instanceof Uint8Array ? key.buffer as ArrayBuffer : key;
  const cryptoKey = await crypto.subtle.importKey(
    "raw", rawKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const msgData = new TextEncoder().encode(message);
  return crypto.subtle.sign("HMAC", cryptoKey, msgData.buffer as ArrayBuffer);
}

async function getSigningKey(secret: string, date: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate    = await hmacSha256(new TextEncoder().encode(`AWS4${secret}`), date);
  const kRegion  = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

interface SigV4Headers {
  Authorization: string;
  "x-amz-date":  string;
}

async function signSESRequest(
  body:      string,
  region:    string,
  accessKey: string,
  secretKey: string
): Promise<SigV4Headers> {
  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const host      = `email.${region}.amazonaws.com`;
  const service   = "ses";
  const path      = "/v2/email/outbound-emails";

  const payloadHash  = await sha256Hex(body);
  const canonHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
  const signedHdrs   = "content-type;host;x-amz-date";
  const canonReq     = `POST\n${path}\n\n${canonHeaders}\n${signedHdrs}\n${payloadHash}`;
  const scope        = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonReq)}`;
  const signingKey   = await getSigningKey(secretKey, dateStamp, region, service);
  const signature    = toHex(await hmacSha256(signingKey, stringToSign));

  return {
    Authorization: `AWS4-HMAC-SHA256 Credential=${accessKey}/${scope}, SignedHeaders=${signedHdrs}, Signature=${signature}`,
    "x-amz-date":  amzDate,
  };
}

export class SESProvider extends BaseEmailProvider {
  name = "ses";

  async send(msg: OutboundEmailMessage): Promise<SendResult> {
    const region    = this.config.sesRegion         ?? "us-east-1";
    const accessKey = this.config.sesAccessKeyId;
    const secretKey = this.config.sesSecretAccessKey;
    if (!accessKey || !secretKey) {
      return { success: false, error: "AWS SES credentials not configured" };
    }

    const destination: Record<string, string[]> = {
      ToAddresses: msg.to.map(a => this.formatAddress(a)),
    };
    if (msg.cc?.length) destination.CcAddresses = msg.cc.map(a => this.formatAddress(a));

    const payload = {
      FromEmailAddress: this.formatAddress(msg.from),
      Destination: destination,
      ReplyToAddresses: msg.replyTo ? [msg.replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: msg.subject },
          Body: {
            ...(msg.html ? { Html: { Data: msg.html } } : {}),
            ...(msg.text ? { Text: { Data: msg.text } } : {}),
          },
          Headers: buildSESHeaders(msg),
        },
      },
    };

    const body = JSON.stringify(payload);
    const sigHeaders = await signSESRequest(body, region, accessKey, secretKey);
    const url = `https://email.${region}.amazonaws.com/v2/email/outbound-emails`;

    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...sigHeaders,
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `SES ${res.status}: ${text}` };
    }

    const json = await res.json().catch(() => ({})) as { MessageId?: string };
    return { success: true, messageId: json.MessageId };
  }
}

function buildSESHeaders(msg: OutboundEmailMessage): { Name: string; Value: string }[] {
  const headers: { Name: string; Value: string }[] = [];
  if (msg.inReplyTo) headers.push({ Name: "In-Reply-To", Value: `<${msg.inReplyTo}>` });
  if (msg.references?.length) {
    headers.push({ Name: "References", Value: msg.references.map(r => `<${r}>`).join(" ") });
  }
  for (const [k, v] of Object.entries(msg.headers ?? {})) {
    headers.push({ Name: k, Value: v });
  }
  return headers;
}
