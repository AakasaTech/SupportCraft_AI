import { NextResponse }       from "next/server";
import { getCurrentUser }     from "@/lib/auth/helpers";
import { callAIProvider }     from "@/lib/ai/provider";
import { checkAILimits, trackUsage, estimateCost } from "@/lib/ai/usage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({
    plan: user.organization.plan,
    freepass_plan: user.organization.freepassPlan,
    freepass_until: user.organization.freepassUntil?.toISOString() ?? null,
  });

  const { allowed } = await checkAILimits(user.profile.organizationId, effectivePlan);
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
      orgId: user.profile.organizationId, feature: "kb_generate", provider: result.provider,
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
