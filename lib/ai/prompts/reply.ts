import type { ReplyTone, TicketContext } from "../types";

const TONE_INSTRUCTIONS: Record<ReplyTone, string> = {
  professional: "Write in a professional, business-appropriate tone. Clear and courteous.",
  friendly:     "Write in a warm, friendly tone. Approachable but still helpful.",
  empathetic:   "Lead with empathy and acknowledgment. Show genuine understanding of the customer's frustration.",
  concise:      "Be brief and direct. Get to the point immediately. No filler phrases.",
  formal:       "Use formal language suitable for enterprise or legal contexts. Full sentences, no contractions.",
};

export function buildReplyPrompt(ctx: TicketContext, tone: ReplyTone = "professional"): {
  system: string;
  user:   string;
} {
  const toneInstruction = TONE_INSTRUCTIONS[tone];

  const kbSection = ctx.kbArticles.length > 0
    ? `\n\nKnowledge Base:\n${ctx.kbArticles.map((a) => `[${a.title}]\n${a.content}`).join("\n\n")}`
    : "";

  const historySection = ctx.conversation.length > 0
    ? `\n\nConversation so far:\n${ctx.conversation.map((m) => `${m.role === "customer" ? "Customer" : "Agent"}: ${m.content}`).join("\n")}`
    : "";

  const system = `You are a customer support agent for ${ctx.org.name}. ${toneInstruction}
Write a helpful, solution-focused reply. Do not use generic filler openers like "I hope this message finds you well".
Do not invent facts. If you don't know, say so honestly.${kbSection}`;

  const user = `Ticket: ${ctx.ticket.title}
Customer's message: ${ctx.ticket.description}
Priority: ${ctx.ticket.priority}
Category: ${ctx.ticket.category ?? "General"}${historySection}

Write a reply:`;

  return { system, user };
}
