import type { EmailProvider } from "./base";
import type { ProviderConfig, OutboundProvider } from "../types";
import { SESProvider }      from "./ses";
import { SmtpProvider }     from "./smtp";
import { SendGridProvider } from "./sendgrid";
import { MailgunProvider }  from "./mailgun";
import { PostmarkProvider } from "./postmark";

export function createEmailProvider(
  provider: OutboundProvider,
  config:   ProviderConfig
): EmailProvider {
  switch (provider) {
    case "ses":      return new SESProvider(config);
    case "smtp":     return new SmtpProvider(config);
    case "sendgrid": return new SendGridProvider(config);
    case "mailgun":  return new MailgunProvider(config);
    case "postmark": return new PostmarkProvider(config);
    default:         return new SmtpProvider(config);
  }
}

export type { EmailProvider };
export { SESProvider, SmtpProvider, SendGridProvider, MailgunProvider, PostmarkProvider };
