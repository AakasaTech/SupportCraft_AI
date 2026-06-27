import { createAdminClient } from "@/lib/supabase/server";
import type { TicketContext } from "./types";

export async function buildTicketContext(
  ticketId: string,
  orgId:    string,
  opts: { kbLimit?: number; messageLimit?: number } = {}
): Promise<TicketContext | null> {
  const admin      = createAdminClient();
  const kbLimit    = opts.kbLimit    ?? 5;
  const msgLimit   = opts.messageLimit ?? 20;

  const [
    { data: ticket },
    { data: org },
    { data: messages },
    { data: articles },
  ] = await Promise.all([
    admin
      .from("tickets")
      .select("id, title, description, status, priority, category, tags, sentiment")
      .eq("id", ticketId)
      .eq("org_id", orgId)
      .single(),

    admin
      .from("organizations")
      .select("id, name, plan")
      .eq("id", orgId)
      .single(),

    admin
      .from("ticket_messages")
      .select("content, is_customer, is_ai, is_internal")
      .eq("ticket_id", ticketId)
      .eq("is_internal", false)
      .order("created_at", { ascending: true })
      .limit(msgLimit),

    admin
      .from("knowledge_articles")
      .select("title, content")
      .eq("org_id", orgId)
      .eq("status", "published")
      .limit(kbLimit),
  ]);

  if (!ticket || !org) return null;

  const conversation = (messages ?? []).map((m) => ({
    role:    m.is_customer ? "customer" as const
           : m.is_ai       ? "ai"       as const
           :                 "agent"    as const,
    content: m.content,
  }));

  const kbArticles = (articles ?? []).map((a) => ({
    title:   a.title,
    content: a.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 600),
  }));

  return {
    ticket: {
      id:          ticket.id,
      title:       ticket.title,
      description: ticket.description,
      status:      ticket.status,
      priority:    ticket.priority,
      category:    ticket.category ?? null,
      tags:        ticket.tags ?? [],
      sentiment:   ticket.sentiment ?? null,
    },
    conversation,
    kbArticles,
    org: { id: org.id, name: org.name, plan: org.plan },
  };
}
