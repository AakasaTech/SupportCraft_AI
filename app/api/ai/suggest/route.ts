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
    .select("plan")
    .eq("id", profile.org_id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { allowed, reason } = await checkAIAccess(profile.org_id, org.plan, "ai_suggested_responses");
  if (!allowed) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  const body = await request.json();
  const { ticketId } = body;

  if (!ticketId) {
    return NextResponse.json({ error: "ticketId is required" }, { status: 400 });
  }

  const { data: ticket } = await supabase
    .from("tickets")
    .select("title, description, status, priority, category")
    .eq("id", ticketId)
    .eq("org_id", profile.org_id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("content, is_customer, is_ai, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .limit(20);

  const { data: articles } = await supabase
    .from("knowledge_articles")
    .select("title, content")
    .eq("org_id", profile.org_id)
    .eq("status", "published")
    .limit(5);

  const kbContext =
    articles && articles.length > 0
      ? `\n\nKnowledge Base Articles:\n${articles.map((a) => `**${a.title}**\n${a.content.slice(0, 500)}`).join("\n\n")}`
      : "";

  const conversationHistory =
    messages && messages.length > 0
      ? `\n\nConversation history:\n${messages.map((m) => `${m.is_customer ? "Customer" : "Agent"}: ${m.content}`).join("\n")}`
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

  await supabase.from("ai_usage_logs").insert({
    org_id: profile.org_id,
    feature: "suggest",
    provider: process.env.AI_PROVIDER ?? "openai",
    tokens_used: tokensUsed,
  });

  return NextResponse.json({ suggestion: text });
}
