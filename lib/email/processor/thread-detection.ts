import { createAdminClient } from "@/lib/supabase/server";

export interface ThreadDetectionResult {
  ticketId:   string | null;
  isReply:    boolean;
  confidence: "high" | "medium" | "low";
  method?:    "message_id" | "in_reply_to" | "references" | "subject_token" | "hidden_token";
}

// Matches [SUP-1234] or [TKT-1234] patterns in subject
const TICKET_TOKEN_RE = /\[(?:SUP|TKT)-([A-Z0-9]+)\]/i;

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
  const admin = createAdminClient();

  // ── 1. Hidden token in body ───────────────────────────────────────────────
  const bodyToSearch = params.bodyHtml ?? params.bodyPlain ?? "";
  const hiddenMatch  = HIDDEN_TOKEN_RE.exec(bodyToSearch);
  if (hiddenMatch) {
    const { data: ticket } = await admin
      .from("tickets")
      .select("id")
      .eq("org_id", params.orgId)
      .eq("id", hiddenMatch[1])
      .single();
    if (ticket) return { ticketId: ticket.id, isReply: true, confidence: "high", method: "hidden_token" };
  }

  // ── 2. Subject token ─────────────────────────────────────────────────────
  const subjectMatch = TICKET_TOKEN_RE.exec(params.subject);
  if (subjectMatch) {
    // Try matching by the short code (sequential id stored in metadata or title search)
    const { data: tickets } = await admin
      .from("tickets")
      .select("id, title")
      .eq("org_id", params.orgId)
      .ilike("title", `%${params.subject.replace(TICKET_TOKEN_RE, "").trim().slice(0, 60)}%`)
      .limit(1);
    if (tickets?.[0]) {
      return { ticketId: tickets[0].id, isReply: true, confidence: "medium", method: "subject_token" };
    }
  }

  // ── 3. In-Reply-To header → match email_messages.message_id ─────────────
  if (params.inReplyTo) {
    const { data: msg } = await admin
      .from("email_messages")
      .select("ticket_id")
      .eq("message_id", params.inReplyTo)
      .eq("org_id", params.orgId)
      .single();
    if (msg?.ticket_id) {
      return { ticketId: msg.ticket_id, isReply: true, confidence: "high", method: "in_reply_to" };
    }
  }

  // ── 4. References chain ──────────────────────────────────────────────────
  if (params.references.length > 0) {
    const { data: msgs } = await admin
      .from("email_messages")
      .select("ticket_id")
      .eq("org_id", params.orgId)
      .in("message_id", params.references)
      .limit(1);
    if (msgs?.[0]?.ticket_id) {
      return { ticketId: msgs[0].ticket_id, isReply: true, confidence: "high", method: "references" };
    }
  }

  // ── 5. No match → new ticket ─────────────────────────────────────────────
  return { ticketId: null, isReply: false, confidence: "high" };
}
