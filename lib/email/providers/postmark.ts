import { BaseEmailProvider } from "./base";
import type { OutboundEmailMessage, SendResult } from "../types";

export class PostmarkProvider extends BaseEmailProvider {
  name = "postmark";

  async send(msg: OutboundEmailMessage): Promise<SendResult> {
    const token = this.config.postmarkToken;
    if (!token) return { success: false, error: "Postmark server token not configured" };

    const body: Record<string, unknown> = {
      From:     this.formatAddress(msg.from),
      To:       msg.to.map(a => this.formatAddress(a)).join(","),
      Subject:  msg.subject,
      ReplyTo:  msg.replyTo ?? undefined,
    };

    if (msg.html)  body.HtmlBody  = msg.html;
    if (msg.text)  body.TextBody  = msg.text;
    if (msg.cc?.length) body.Cc  = msg.cc.map(a => this.formatAddress(a)).join(",");

    const threadHeaders: Record<string, string> = {};
    if (msg.inReplyTo)       threadHeaders["In-Reply-To"]  = `<${msg.inReplyTo}>`;
    if (msg.references?.length) threadHeaders["References"] = msg.references.map(r => `<${r}>`).join(" ");

    const customHeaders = { ...msg.headers, ...threadHeaders };
    if (Object.keys(customHeaders).length > 0) {
      body.Headers = Object.entries(customHeaders).map(([Name, Value]) => ({ Name, Value }));
    }

    if (msg.attachments?.length) {
      body.Attachments = msg.attachments.map(a => ({
        Name:        a.filename,
        Content:     typeof a.content === "string" ? a.content : a.content.toString("base64"),
        ContentType: a.contentType,
        ContentID:   a.inline && a.contentId ? `cid:${a.contentId}` : undefined,
      }));
    }

    const res = await fetch("https://api.postmarkapp.com/email", {
      method:  "POST",
      headers: {
        "Accept":                  "application/json",
        "Content-Type":            "application/json",
        "X-Postmark-Server-Token": token,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Postmark ${res.status}: ${text}` };
    }

    const json = await res.json().catch(() => ({})) as { MessageID?: string };
    return { success: true, messageId: json.MessageID };
  }
}
