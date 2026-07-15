import { NextResponse }         from "next/server";
import { createClient }         from "@/lib/supabase/server";
import { buildTicketContext }   from "@/lib/ai/context";
import { generateReply }        from "@/lib/ai/services/reply";
import { checkAILimits }        from "@/lib/ai/usage";
import type { ReplyTone }       from "@/lib/ai/types";

const VALID_TONES: ReplyTone[] = ["professional", "friendly", "empathetic", "concise", "formal"];

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { data: org } = await supabase
    .from("organizations").select("plan, freepass_plan, freepass_until").eq("id", profile.org_id).single();
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({ plan: org.plan as import("@/types/database").OrgPlan, freepass_plan: org.freepass_plan ?? null, freepass_until: org.freepass_until ?? null });

  const { allowed, usage } = await checkAILimits(profile.org_id, effectivePlan);
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

  const ctx = await buildTicketContext(ticketId, profile.org_id);
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
