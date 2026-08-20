import { prisma } from "@/lib/prisma";
import { resolveEffectivePlan } from "@/lib/plans";
import type { TicketContext } from "./types";

export async function buildTicketContext(
  ticketId: string,
  orgId:    string,
  opts: { kbLimit?: number; messageLimit?: number } = {}
): Promise<TicketContext | null> {
  const kbLimit  = opts.kbLimit    ?? 5;
  const msgLimit = opts.messageLimit ?? 20;

  const [ticket, org, messages, articles] = await Promise.all([
    prisma.ticket.findFirst({
      where:  { id: ticketId, organizationId: orgId },
      select: { id: true, title: true, description: true, status: true, priority: true, category: true, tags: true, sentiment: true },
    }),

    prisma.organization.findUnique({
      where:  { id: orgId },
      select: { id: true, name: true, plan: true, freepassPlan: true, freepassUntil: true },
    }),

    prisma.ticketMessage.findMany({
      where:   { ticketId, isInternal: false },
      select:  { content: true, isCustomer: true, isAi: true },
      orderBy: { createdAt: "asc" },
      take:    msgLimit,
    }),

    prisma.knowledgeArticle.findMany({
      where:  { organizationId: orgId, status: "published" },
      select: { title: true, content: true },
      take:   kbLimit,
    }),
  ]);

  if (!ticket || !org) return null;

  const conversation = messages.map((m) => ({
    role:    m.isCustomer ? "customer" as const
           : m.isAi       ? "ai"       as const
           :                "agent"    as const,
    content: m.content,
  }));

  const kbArticles = articles.map((a) => ({
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
    org: {
      id: org.id, name: org.name,
      plan: resolveEffectivePlan({
        plan: org.plan,
        freepass_plan: org.freepassPlan,
        freepass_until: org.freepassUntil?.toISOString() ?? null,
      }),
    },
  };
}
