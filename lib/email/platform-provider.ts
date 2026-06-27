/**
 * Platform-managed outbound email infrastructure.
 *
 * Customers never configure SMTP/API keys — SupportCraft handles all sending
 * on behalf of every tenant from the shared @supportcraft.aakasa.dev domain.
 * Provider + credentials come from platform env vars, not per-org DB config.
 */

import { createEmailProvider, type EmailProvider } from "./providers";
import type { OutboundProvider, ProviderConfig } from "./types";

export const SENDING_DOMAIN = process.env.SENDING_DOMAIN ?? "supportcraft.aakasa.dev";

/** `acme` → `acme@supportcraft.aakasa.dev` */
export function getOrgEmail(tenantSlug: string): string {
  return `${tenantSlug}@${SENDING_DOMAIN}`;
}

/** Returns the platform-wide outbound provider, configured via env vars. */
export function getPlatformProvider(): EmailProvider {
  const name = (process.env.EMAIL_PROVIDER ?? "smtp") as OutboundProvider;

  const config: ProviderConfig = {
    // AWS SES
    sesRegion:          process.env.AWS_SES_REGION,
    sesAccessKeyId:     process.env.AWS_SES_ACCESS_KEY_ID,
    sesSecretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
    // SMTP (SES-SMTP, Postfix, any relay)
    smtpHost:           process.env.SMTP_HOST,
    smtpPort:           parseInt(process.env.SMTP_PORT ?? "587", 10),
    smtpSecure:         process.env.SMTP_SECURE === "true",
    smtpUser:           process.env.SMTP_USER,
    smtpPass:           process.env.SMTP_PASS,
    // SendGrid
    sendgridApiKey:     process.env.SENDGRID_API_KEY,
    // Mailgun
    mailgunApiKey:      process.env.MAILGUN_API_KEY,
    mailgunDomain:      process.env.MAILGUN_DOMAIN ?? SENDING_DOMAIN,
    // Postmark
    postmarkToken:      process.env.POSTMARK_SERVER_TOKEN,
  };

  return createEmailProvider(name, config);
}
