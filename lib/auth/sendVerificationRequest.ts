import { sendEmail, getEmailFrom } from "@/lib/email/mailer";

const APP_NAME = "SupportCraft AI";

/**
 * Sends the magic-link sign-in email via the app's existing multi-provider
 * mailer (lib/email/mailer.ts — Gmail or Resend depending on EMAIL_PROVIDER)
 * instead of NextAuth's default nodemailer transport.
 */
export async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
}) {
  const { identifier: to, url } = params;
  const { host } = new URL(url);
  const from = `${APP_NAME} <${getEmailFrom()}>`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a1a1a;">Sign in to ${APP_NAME}</h2>
      <p style="color:#555;">Click the button below to sign in to your customer portal at ${host}.</p>
      <a href="${url}"
         style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Sign in
      </a>
      <p style="color:#999;font-size:13px;">This link expires in 24 hours and can only be used once.</p>
      <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
  const text = `Sign in to ${APP_NAME}\n\n${url}\n\nThis link expires in 24 hours and can only be used once.`;

  const result = await sendEmail({ from, to, subject: `Sign in to ${APP_NAME}`, html, text });
  if (result.error) {
    throw new Error(`Failed to send verification email: ${result.error}`);
  }
}
