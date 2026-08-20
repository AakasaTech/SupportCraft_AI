import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { generateCompletion } from "@/lib/ai";
import { checkAIAccess } from "@/lib/ai/usage";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resolveEffectivePlan } = await import("@/lib/plans");
  const effectivePlan = resolveEffectivePlan({
    plan: user.organization.plan,
    freepass_plan: user.organization.freepassPlan,
    freepass_until: user.organization.freepassUntil?.toISOString() ?? null,
  });

  const { allowed, reason } = await checkAIAccess(user.profile.organizationId, effectivePlan, "ai_auto_categorize");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId } = body;

  const ticket = await prisma.ticket.findFirst({
    where:  { id: ticketId, organizationId: user.profile.organizationId },
    select: { title: true, description: true },
  });

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

  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      priority: classification.priority,
      category: classification.category,
      tags: classification.tags,
    },
  });

  await prisma.aiUsageLog.create({
    data: {
      organizationId: user.profile.organizationId,
      feature: "categorize",
      provider: process.env.AI_PROVIDER ?? "openai",
      tokensUsed,
    },
  });

  return NextResponse.json({ classification });
}
