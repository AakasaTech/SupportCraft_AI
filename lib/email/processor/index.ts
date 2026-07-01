import { sanitizeEmailHtml, cleanPlainText, detectLanguage } from "../parser";
import { checkSpam } from "../spam";
import { detectThread } from "./thread-detection";
import { createTicketFromEmail, addReplyToTicket } from "./ticket-service";
import { processAttachments } from "./attachment-processor";
import type { InboundEmailPayload } from "../types";

export interface ProcessResult {
  status:          "created" | "replied" | "spam" | "error";
  ticketId?:       string;
  emailMessageId?: string;
  reason?:         string;
}

export async function processInboundEmail(
  payload:      InboundEmailPayload,
  rawInboundId: string | null = null
): Promise<ProcessResult> {
  try {
    // ── Spam detection (Layer 2) ───────────────────────────────────────────
    const spamResult = checkSpam(payload);
    if (spamResult.isSpam) {
      return { status: "spam", reason: spamResult.reasons.join(", ") };
    }

    // ── Clean content ──────────────────────────────────────────────────────
    const sanitizedHtml = payload.body_html
      ? sanitizeEmailHtml(payload.body_html)
      : null;

    const cleanedPlain = payload.body_plain
      ? cleanPlainText(payload.body_plain)
      : null;

    const language = detectLanguage(cleanedPlain ?? payload.subject);

    // ── Thread detection ───────────────────────────────────────────────────
    const thread = await detectThread({
      orgId:      payload.tenant_id,
      messageId:  payload.message_id,
      inReplyTo:  payload.in_reply_to,
      references: payload.references,
      subject:    payload.subject,
      bodyHtml:   payload.body_html,
      bodyPlain:  payload.body_plain,
    });

    let ticketId:       string;
    let emailMessageId: string;

    if (thread.isReply && thread.ticketId) {
      // ── Append reply to existing ticket ───────────────────────────────
      const result = await addReplyToTicket({
        ticketId:      thread.ticketId,
        orgId:         payload.tenant_id,
        toAddress:     payload.to_address,
        fromAddress:   payload.from_address,
        bodyPlain:     cleanedPlain,
        sanitizedHtml,
        messageId:     payload.message_id,
        inReplyTo:     payload.in_reply_to,
        references:    payload.references,
        rawInboundId,
      });
      ticketId       = thread.ticketId;
      emailMessageId = result.emailMessageId;

      // Process attachments for the reply
      if (payload.attachments.length > 0) {
        await processAttachments({
          orgId:          payload.tenant_id,
          ticketId,
          emailMessageId,
          attachments:    payload.attachments.map(a => ({
            filename:    a.filename,
            contentType: a.content_type,
            size:        a.size,
            contentId:   a.content_id,
            content:     a.content,
          })),
        });
      }

      return { status: "replied", ticketId, emailMessageId };

    } else {
      // ── Create new ticket ──────────────────────────────────────────────
      const result = await createTicketFromEmail({
        orgId:         payload.tenant_id,
        toAddress:     payload.to_address,
        fromAddress:   payload.from_address,
        fromName:      payload.from_name,
        subject:       payload.subject,
        bodyPlain:     cleanedPlain,
        bodyHtml:      payload.body_html,
        sanitizedHtml,
        messageId:     payload.message_id,
        inReplyTo:     payload.in_reply_to,
        references:    payload.references,
        rawInboundId,
        channel:       "email",
      });
      ticketId       = result.ticketId;
      emailMessageId = result.emailMessageId;

      // Process attachments for the new ticket
      if (payload.attachments.length > 0) {
        await processAttachments({
          orgId:          payload.tenant_id,
          ticketId,
          emailMessageId,
          attachments:    payload.attachments.map(a => ({
            filename:    a.filename,
            contentType: a.content_type,
            size:        a.size,
            contentId:   a.content_id,
            content:     a.content,
          })),
        });
      }

      return { status: "created", ticketId, emailMessageId };
    }

  } catch (err) {
    console.error("Email processing error:", err);
    return { status: "error", reason: String(err) };
  }
}
