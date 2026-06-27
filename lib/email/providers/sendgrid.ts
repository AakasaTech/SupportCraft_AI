import { BaseEmailProvider } from "./base";
import type { OutboundEmailMessage, SendResult } from "../types";

export class SendGridProvider extends BaseEmailProvider {
  name = "sendgrid";

  async send(msg: OutboundEmailMessage): Promise<SendResult> {
    const apiKey = this.config.sendgridApiKey;
    if (!apiKey) return { success: false, error: "SendGrid API key not configured" };

    const body = {
      personalizations: [{
        to: msg.to.map(a => ({ email: a.address, name: a.name })),
        cc: msg.cc?.map(a => ({ email: a.address, name: a.name })),
      }],
      from:     { email: msg.from.address, name: msg.from.name },
      reply_to: msg.replyTo ? { email: msg.replyTo } : undefined,
      subject:  msg.subject,
      content: [
        ...(msg.text ? [{ type: "text/plain", value: msg.text }] : []),
        ...(msg.html ? [{ type: "text/html",  value: msg.html }] : []),
      ],
      headers: {
        ...msg.headers,
        ...(msg.inReplyTo  ? { "In-Reply-To":  `<${msg.inReplyTo}>` }     : {}),
        ...(msg.references?.length ? { "References": msg.references.map(r => `<${r}>`).join(" ") } : {}),
      },
      attachments: msg.attachments?.map(a => ({
        content:     typeof a.content === "string" ? a.content : a.content.toString("base64"),
        filename:    a.filename,
        type:        a.contentType,
        disposition: a.inline ? "inline" : "attachment",
        content_id:  a.contentId,
      })),
    };

    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `SendGrid ${res.status}: ${text}` };
    }

    const messageId = res.headers.get("x-message-id") ?? undefined;
    return { success: true, messageId };
  }
}
