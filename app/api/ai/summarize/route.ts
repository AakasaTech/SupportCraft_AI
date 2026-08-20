import { NextResponse }       from "next/server";
import { getCurrentUser }     from "@/lib/auth/helpers";
import { buildTicketContext } from "@/lib/ai/context";
import { summarizeTicket }    from "@/lib/ai/services/summarize";
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

  const { allowed, reason } = await checkAIAccess(user.profile.organizationId, effectivePlan, "ai_summaries");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId } = body as { ticketId: string };

  if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });

  const ctx = await buildTicketContext(ticketId, user.profile.organizationId);
  if (!ctx) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  try {
    const summary = await summarizeTicket(ctx, user.id);
    return NextResponse.json({ summary });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
