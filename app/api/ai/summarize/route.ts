import { NextResponse }       from "next/server";
import { createClient }       from "@/lib/supabase/server";
import { buildTicketContext } from "@/lib/ai/context";
import { summarizeTicket }    from "@/lib/ai/services/summarize";
import { checkAIAccess }      from "@/lib/ai/usage";

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

  const { allowed, reason } = await checkAIAccess(profile.org_id, effectivePlan, "ai_summaries");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId } = body as { ticketId: string };

  if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });

  const ctx = await buildTicketContext(ticketId, profile.org_id);
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
