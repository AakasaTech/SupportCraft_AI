import { callAIProvider }       from "../provider";
import { buildSummarizePrompt } from "../prompts/summarize";
import { estimateCost, trackUsage } from "../usage";
import { buildCacheKey, getCached, setCached } from "../cache";
import type { TicketSummary, AIUsageRecord } from "../types";

export async function summarizeTicket(
  ctx:    import("../types").TicketContext,
  userId?: string
): Promise<TicketSummary> {
  const cacheKey = buildCacheKey("summarize", ctx.ticket.id, String(ctx.conversation.length));
  const cached   = getCached(cacheKey);
  if (cached) {
    return JSON.parse(cached) as TicketSummary;
  }

  const { system, user } = buildSummarizePrompt(ctx);

  const result = await callAIProvider(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { maxTokens: 512 }
  );

  let summary: TicketSummary;
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    summary = JSON.parse(jsonMatch?.[0] ?? result.text) as TicketSummary;
  } catch {
    summary = {
      summary:       result.text,
      keyPoints:     [],
      suggestedNext: "",
      resolved:      ["resolved", "closed"].includes(ctx.ticket.status),
    };
  }

  setCached(cacheKey, JSON.stringify(summary), 3 * 60 * 1000);

  const usage: AIUsageRecord = {
    orgId:            ctx.org.id,
    feature:          "summarize",
    provider:         result.provider,
    model:            result.model,
    tokensUsed:       result.tokensUsed,
    promptTokens:     result.promptTokens,
    completionTokens: result.completionTokens,
    latencyMs:        result.latencyMs,
    estimatedCostUsd: estimateCost(result.model, result.promptTokens, result.completionTokens),
    userId,
    ticketId:         ctx.ticket.id,
    cached:           false,
  };
  await trackUsage(usage);

  return summary;
}
