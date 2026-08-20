import { NextResponse }         from "next/server";
import { getCurrentUser }       from "@/lib/auth/helpers";
import { buildTicketContext }   from "@/lib/ai/context";
import { generateReply }        from "@/lib/ai/services/reply";
import { checkAILimits }        from "@/lib/ai/usage";
import type { ReplyTone }       from "@/lib/ai/types";

const VALID_TONES: ReplyTone[] = ["professional", "friendly", "empathetic", "concise", "formal"];

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({
    plan: user.organization.plan,
    freepass_plan: user.organization.freepassPlan,
    freepass_until: user.organization.freepassUntil?.toISOString() ?? null,
  });

  const { allowed, usage } = await checkAILimits(user.profile.organizationId, effectivePlan);
  if (!allowed) {
    return NextResponse.json(
      { error: "Monthly AI usage limit reached. Upgrade your plan.", usage },
      { status: 429 }
    );
  }

  const body = await request.json();
  const { ticketId, tone } = body as { ticketId: string; tone?: string };

  if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });

  const resolvedTone: ReplyTone = VALID_TONES.includes(tone as ReplyTone)
    ? (tone as ReplyTone)
    : "professional";

  const ctx = await buildTicketContext(ticketId, user.profile.organizationId);
  if (!ctx) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  try {
    const { text, cached } = await generateReply(ctx, resolvedTone, user.id);
    return NextResponse.json({ suggestion: text, cached });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
