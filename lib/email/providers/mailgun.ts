import { BaseEmailProvider } from "./base";
import type { OutboundEmailMessage, SendResult } from "../types";

export class MailgunProvider extends BaseEmailProvider {
  name = "mailgun";

  async send(msg: OutboundEmailMessage): Promise<SendResult> {
    const apiKey = this.config.mailgunApiKey;
    const domain = this.config.mailgunDomain;
    if (!apiKey || !domain) return { success: false, error: "Mailgun API key / domain not configured" };

    const form = new FormData();
    form.append("from",    this.formatAddress(msg.from));
    form.append("to",      msg.to.map(a => this.formatAddress(a)).join(","));
    form.append("subject", msg.subject);
    if (msg.replyTo)  form.append("h:Reply-To",  msg.replyTo);
    if (msg.html)     form.append("html",        msg.html);
    if (msg.text)     form.append("text",        msg.text);
    if (msg.cc?.length)  form.append("cc",  msg.cc.map(a => this.formatAddress(a)).join(","));
    if (msg.inReplyTo)   form.append("h:In-Reply-To", `<${msg.inReplyTo}>`);
    if (msg.references?.length) {
      form.append("h:References", msg.references.map(r => `<${r}>`).join(" "));
    }

    if (msg.attachments) {
      for (const att of msg.attachments) {
        let base64: string;
        if (typeof att.content === "string") {
          base64 = att.content;
        } else {
          // Buffer → base64
          base64 = (att.content as Buffer).toString("base64");
        }
        const binary = atob(base64);
        const blob   = new Blob(
          [Uint8Array.from(binary, c => c.charCodeAt(0))],
          { type: att.contentType }
        );
        form.append(att.inline ? "inline" : "attachment", blob, att.filename);
      }
    }

    const credentials = btoa(`api:${apiKey}`);
    const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
      method:  "POST",
      headers: { "Authorization": `Basic ${credentials}` },
      body:    form,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { success: false, error: `Mailgun ${res.status}: ${text}` };
    }

    const json = await res.json().catch(() => ({})) as { id?: string };
    return { success: true, messageId: json.id };
  }
}
