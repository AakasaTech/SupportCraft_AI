import type { TicketContext } from "../types";

export function buildSummarizePrompt(ctx: TicketContext): {
  system: string;
  user:   string;
} {
  const history = ctx.conversation
    .map((m) => `${m.role === "customer" ? "Customer" : "Agent"}: ${m.content}`)
    .join("\n");

  return {
    system: `You are a support ticket analyst. Summarize tickets concisely and accurately.
Return ONLY valid JSON in this exact structure — no markdown, no code fences:
{
  "summary": "2-3 sentence overview of the issue and current state",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "suggestedNext": "One recommended next action for the agent",
  "resolved": true|false
}`,
    user: `Ticket: ${ctx.ticket.title}
Status: ${ctx.ticket.status}
Priority: ${ctx.ticket.priority}

Original message: ${ctx.ticket.description}

${history ? `Conversation:\n${history}` : ""}`,
  };
}
