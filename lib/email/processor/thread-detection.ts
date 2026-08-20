import { prisma } from "@/lib/prisma";

export interface ThreadDetectionResult {
  ticketId:   string | null;
  isReply:    boolean;
  confidence: "high" | "medium" | "low";
  method?:    "message_id" | "in_reply_to" | "references" | "subject_token" | "hidden_token";
}

// Matches [Ticket #SUP-1234], [SUP-1234], or [TKT-1234] in subject — extracts the ticket_number
const TICKET_TOKEN_RE = /\[(?:Ticket\s+#)?([A-Z]+-\d+)\]/i;

// <!-- ticket:uuid --> hidden token in HTML body
const HIDDEN_TOKEN_RE = /<!--\s*ticket:([0-9a-f-]{36})\s*-->/i;

export async function detectThread(params: {
  orgId:       string;
  messageId:   string;
  inReplyTo:   string | null;
  references:  string[];
  subject:     string;
  bodyHtml:    string | null;
  bodyPlain:   string | null;
}): Promise<ThreadDetectionResult> {
  // ── 1. Hidden token in body ───────────────────────────────────────────────
  const bodyToSearch = params.bodyHtml ?? params.bodyPlain ?? "";
  const hiddenMatch  = HIDDEN_TOKEN_RE.exec(bodyToSearch);
  if (hiddenMatch) {
    const ticket = await prisma.ticket.findFirst({
      where:  { organizationId: params.orgId, id: hiddenMatch[1] },
      select: { id: true },
    });
    if (ticket) return { ticketId: ticket.id, isReply: true, confidence: "high", method: "hidden_token" };
  }

  // ── 2. Subject token — [Ticket #SUP-1003] or [SUP-1003] ────────────────
  const subjectMatch = TICKET_TOKEN_RE.exec(params.subject);
  if (subjectMatch) {
    const ticket = await prisma.ticket.findFirst({
      where:  { organizationId: params.orgId, ticketNumber: subjectMatch[1].toUpperCase() },
      select: { id: true },
    });
    if (ticket) {
      return { ticketId: ticket.id, isReply: true, confidence: "high", method: "subject_token" };
    }
  }

  // ── 3. In-Reply-To header → match email_messages.message_id ─────────────
  if (params.inReplyTo) {
    const msg = await prisma.emailMessage.findFirst({
      where:  { messageId: params.inReplyTo, organizationId: params.orgId },
      select: { ticketId: true },
    });
    if (msg?.ticketId) {
      return { ticketId: msg.ticketId, isReply: true, confidence: "high", method: "in_reply_to" };
    }
  }

  // ── 4. References chain ──────────────────────────────────────────────────
  if (params.references.length > 0) {
    const msg = await prisma.emailMessage.findFirst({
      where:  { organizationId: params.orgId, messageId: { in: params.references } },
      select: { ticketId: true },
    });
    if (msg?.ticketId) {
      return { ticketId: msg.ticketId, isReply: true, confidence: "high", method: "references" };
    }
  }

  // ── 5. No match → new ticket ─────────────────────────────────────────────
  return { ticketId: null, isReply: false, confidence: "high" };
}
