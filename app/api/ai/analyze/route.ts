import { NextResponse }       from "next/server";
import { createClient }       from "@/lib/supabase/server";
import { classifyTicket }     from "@/lib/ai/services/classify";
import { checkAIAccess }      from "@/lib/ai/usage";
import { createAdminClient }  from "@/lib/supabase/server";

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

  const { allowed, reason } = await checkAIAccess(profile.org_id, effectivePlan, "ai_ticket_prioritization");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId, applyToTicket = false } = body as {
    ticketId: string;
    applyToTicket?: boolean;
  };

  if (!ticketId) return NextResponse.json({ error: "ticketId is required" }, { status: 400 });

  const { data: ticket } = await supabase
    .from("tickets")
    .select("title, description")
    .eq("id", ticketId)
    .eq("org_id", profile.org_id)
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  try {
    const { classification, sentiment } = await classifyTicket(
      ticketId, profile.org_id, ticket.title, ticket.description, user.id
    );

    if (applyToTicket) {
      const admin = createAdminClient();
      await admin.from("tickets").update({
        priority:  classification.priority,
        category:  classification.category,
        tags:      classification.tags,
        sentiment: sentiment.label,
        updated_at: new Date().toISOString(),
      }).eq("id", ticketId);
    }

    return NextResponse.json({ classification, sentiment });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI request failed" },
      { status: 500 }
    );
  }
}
