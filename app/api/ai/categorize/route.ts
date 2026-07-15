import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCompletion } from "@/lib/ai";
import { checkAIAccess } from "@/lib/ai/usage";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("plan, freepass_plan, freepass_until")
    .eq("id", profile.org_id)
    .single();

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({ plan: org.plan as import("@/types/database").OrgPlan, freepass_plan: org.freepass_plan ?? null, freepass_until: org.freepass_until ?? null });

  const { allowed, reason } = await checkAIAccess(profile.org_id, effectivePlan, "ai_auto_categorize");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId } = body;

  const { data: ticket } = await supabase
    .from("tickets")
    .select("title, description")
    .eq("id", ticketId)
    .eq("org_id", profile.org_id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const systemPrompt = `You are a support ticket classifier. Analyze the ticket and respond with ONLY valid JSON in this exact format:
{
  "priority": "low" | "medium" | "high" | "urgent",
  "category": string (e.g. "Billing", "Technical", "General", "Account"),
  "tags": string[] (2-4 relevant tags)
}`;

  const userPrompt = `Ticket title: ${ticket.title}\nDescription: ${ticket.description}`;

  const { text, tokensUsed } = await generateCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], { maxTokens: 256 });

  let classification;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    classification = JSON.parse(jsonMatch?.[0] ?? text);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  await supabase.from("tickets").update({
    priority: classification.priority,
    category: classification.category,
    tags: classification.tags,
    updated_at: new Date().toISOString(),
  }).eq("id", ticketId);

  await supabase.from("ai_usage_logs").insert({
    org_id: profile.org_id,
    feature: "categorize",
    provider: process.env.AI_PROVIDER ?? "openai",
    tokens_used: tokensUsed,
  });

  return NextResponse.json({ classification });
}
