import type { ParsedEmail } from "./parser";
import type { Tenant } from "./tenant-resolver";
import type { SpamSignals } from "./spam-guard";

export interface InboundEmailPayload {
  tenant_id:    string;
  to_address:   string;
  from_address: string;
  from_name:    string | null;
  reply_to:     string | null;
  message_id:   string;
  in_reply_to:  string | null;
  references:   string[];
  subject:      string;
  body_plain:   string | null;
  body_html:    string | null;
  received_at:  string;
  attachments: {
    filename:     string;
    content_type: string;
    size:         number;
    content_id:   string | null;
    content:      string;
  }[];
  headers:      Record<string, string>;
  spam_signals: SpamSignals;
}

export function buildPayload(
  parsed:  ParsedEmail,
  tenant:  Tenant,
  toAddr:  string,
  signals: SpamSignals
): InboundEmailPayload {
  return {
    tenant_id:    tenant.orgId,
    to_address:   toAddr,
    from_address: parsed.from.address,
    from_name:    parsed.from.name,
    reply_to:     parsed.replyTo,
    message_id:   parsed.messageId,
    in_reply_to:  parsed.inReplyTo,
    references:   parsed.references,
    subject:      parsed.subject,
    body_plain:   parsed.bodyPlain,
    body_html:    parsed.bodyHtml,
    received_at:  new Date().toISOString(),
    attachments:  parsed.attachments.map(a => ({
      filename:     a.filename,
      content_type: a.contentType,
      size:         a.size,
      content_id:   a.contentId,
      content:      a.content,
    })),
    headers:      parsed.headers,
    spam_signals: signals,
  };
}
