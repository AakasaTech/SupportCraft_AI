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

  const { allowed, reason } = await checkAIAccess(user.profile.organizationId, effectivePlan, "ai_suggested_responses");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId } = body;

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
  }

  const ticket = await prisma.ticket.findFirst({
    where:  { id: ticketId, organizationId: user.profile.organizationId },
    select: { title: true, description: true, status: true, priority: true, category: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const [messages, articles] = await Promise.all([
    prisma.ticketMessage.findMany({
      where:   { ticketId },
      select:  { content: true, isCustomer: true, isAi: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take:    20,
    }),
    prisma.knowledgeArticle.findMany({
      where:  { organizationId: user.profile.organizationId, status: "published" },
      select: { title: true, content: true },
      take:   5,
    }),
  ]);

  const kbContext =
    articles.length > 0
      ? `\n\nKnowledge Base Articles:\n${articles.map((a) => `**${a.title}**\n${a.content.slice(0, 500)}`).join("\n\n")}`
      : "";

  const conversationHistory =
    messages.length > 0
      ? `\n\nConversation history:\n${messages.map((m) => `${m.isCustomer ? "Customer" : "Agent"}: ${m.content}`).join("\n")}`
      : "";

  const systemPrompt = `You are a helpful customer support agent. Write a professional, empathetic reply to the customer's ticket.
Be concise, clear, and solution-focused. Do not use generic filler phrases. Sign off naturally.${kbContext}`;

  const userPrompt = `Ticket: ${ticket.title}
Description: ${ticket.description}
Priority: ${ticket.priority}
Category: ${ticket.category ?? "General"}${conversationHistory}

Write a reply to this ticket:`;

  const { text, tokensUsed } = await generateCompletion([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  await prisma.aiUsageLog.create({
    data: {
      organizationId: user.profile.organizationId,
      feature: "suggest",
      provider: process.env.AI_PROVIDER ?? "openai",
      tokensUsed,
    },
  });

  return NextResponse.json({ suggestion: text });
}
