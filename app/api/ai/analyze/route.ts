import { NextResponse }       from "next/server";
import { getCurrentUser }     from "@/lib/auth/helpers";
import { prisma }             from "@/lib/prisma";
import { classifyTicket }     from "@/lib/ai/services/classify";
import { checkAIAccess }      from "@/lib/ai/usage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({
    plan: user.organization.plan,
    freepass_plan: user.organization.freepassPlan,
    freepass_until: user.organization.freepassUntil?.toISOString() ?? null,
  });

  const { allowed, reason } = await checkAIAccess(user.profile.organizationId, effectivePlan, "ai_ticket_prioritization");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId, applyToTicket = false } = body as {
    ticketId: string;
    applyToTicket?: boolean;
  };

  if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });

  const ticket = await prisma.ticket.findFirst({
    where:  { id: ticketId, organizationId: user.profile.organizationId },
    select: { title: true, description: true },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  try {
    const { classification, sentiment } = await classifyTicket(
      ticketId, user.profile.organizationId, ticket.title, ticket.description, user.id
    );

    if (applyToTicket) {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          priority:  classification.priority,
          category:  classification.category,
          tags:      classification.tags,
          sentiment: sentiment.label,
        },
      });
    }

    return NextResponse.json({ classification, sentiment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
