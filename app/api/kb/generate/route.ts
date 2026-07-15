import { NextResponse }       from "next/server";
import { createClient }       from "@/lib/supabase/server";
import { callAIProvider }     from "@/lib/ai/provider";
import { checkAILimits, trackUsage, estimateCost } from "@/lib/ai/usage";
import type { OrgPlan }       from "@/types/database";

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
  const effectivePlan = resolveEffectivePlan({ plan: org.plan as OrgPlan, freepass_plan: org.freepass_plan ?? null, freepass_until: org.freepass_until ?? null });

  const { allowed } = await checkAILimits(profile.org_id, effectivePlan);
  if (!allowed) return NextResponse.json({ error: "Monthly AI limit reached." }, { status: 429 });

  const { topic, keywords, tone = "Professional", length = "Medium (600 words)" } =
    await request.json() as { topic: string; keywords?: string; tone?: string; length?: string };

  if (!topic?.trim()) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

  const wordTarget = length.includes("Short") ? 300 : length.includes("Long") ? 1200 : 600;

  const systemPrompt = `You are a technical documentation expert writing customer-facing knowledge base articles.
Write in a ${tone.toLowerCase()} tone. Articles should be well-structured, accurate, and helpful.
Return ONLY valid JSON (no markdown fences) with this exact structure:
{
  "title": "string",
  "excerpt": "string (1-2 sentences summarizing the article)",
  "content": "string (HTML formatted with proper headings h2/h3, paragraphs, lists — target ~${wordTarget} words)",
  "tags": ["string"],
  "seo_title": "string (max 60 chars)",
  "seo_description": "string (max 155 chars)"
}`;

  const userPrompt = `Write a knowledge base article about: ${topic}
${keywords ? `Keywords to include: ${keywords}` : ""}`;

  const maxTokens = wordTarget < 400 ? 800 : wordTarget < 800 ? 1500 : 2500;

  try {
    const result = await callAIProvider(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      { maxTokens }
    );

    let article;
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      article = JSON.parse(jsonMatch?.[0] ?? result.text);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    await trackUsage({
      orgId: profile.org_id, feature: "kb_generate", provider: result.provider,
      model: result.model, tokensUsed: result.tokensUsed, promptTokens: result.promptTokens,
      completionTokens: result.completionTokens, latencyMs: result.latencyMs,
      estimatedCostUsd: estimateCost(result.model, result.promptTokens, result.completionTokens),
      userId: user.id, cached: false,
    });

    return NextResponse.json(article);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Generation failed" }, { status: 500 });
  }
}
