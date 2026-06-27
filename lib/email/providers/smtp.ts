import nodemailer from "nodemailer";
import { BaseEmailProvider } from "./base";
import type { OutboundEmailMessage, SendResult } from "../types";

export class SmtpProvider extends BaseEmailProvider {
  name = "smtp";

  async send(msg: OutboundEmailMessage): Promise<SendResult> {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = this.config;
    if (!smtpHost) return { success: false, error: "SMTP host not configured" };

    const transporter = nodemailer.createTransport({
      host:   smtpHost,
      port:   smtpPort ?? 587,
      secure: smtpSecure ?? false,
      auth:   smtpUser ? { user: smtpUser, pass: smtpPass ?? "" } : undefined,
    });

    const threadHeaders: Record<string, string> = {};
    if (msg.inReplyTo)         threadHeaders["In-Reply-To"]  = `<${msg.inReplyTo}>`;
    if (msg.references?.length) threadHeaders["References"]  = msg.references.map(r => `<${r}>`).join(" ");

    try {
      const info = await transporter.sendMail({
        from:    this.formatAddress(msg.from),
        to:      msg.to.map(a => this.formatAddress(a)).join(", "),
        cc:      msg.cc?.map(a => this.formatAddress(a)).join(", "),
        replyTo: msg.replyTo,
        subject: msg.subject,
        html:    msg.html,
        text:    msg.text,
        headers: { ...msg.headers, ...threadHeaders },
        attachments: msg.attachments?.map(a => ({
          filename:    a.filename,
          content:     a.content,
          contentType: a.contentType,
          cid:         a.contentId ?? undefined,
        })),
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      return { success: false, error: String(err) };
    } finally {
      transporter.close();
    }
  }

  async verifyConnection(): Promise<boolean> {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = this.config;
    if (!smtpHost) return false;
    const transporter = nodemailer.createTransport({
      host: smtpHost, port: smtpPort ?? 587,
      secure: smtpSecure ?? false,
      auth: smtpUser ? { user: smtpUser, pass: smtpPass ?? "" } : undefined,
    });
    try {
      await transporter.verify();
      return true;
    } catch {
      return false;
    } finally {
      transporter.close();
    }
  }
}
