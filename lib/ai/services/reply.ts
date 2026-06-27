import { callAIProvider }    from "../provider";
import { buildReplyPrompt }  from "../prompts/reply";
import { estimateCost, trackUsage } from "../usage";
import { buildCacheKey, getCached, setCached } from "../cache";
import { safeUserContent }   from "../security";
import type { ReplyTone, TicketContext, AIUsageRecord } from "../types";

export async function generateReply(
  ctx:    TicketContext,
  tone:   ReplyTone = "professional",
  userId?: string
): Promise<{ text: string; cached: boolean }> {
  const { safe, sanitized: safeTitle } = safeUserContent(ctx.ticket.title);
  if (!safe) throw new Error("Potential prompt injection detected in ticket content");

  const cacheKey = buildCacheKey("reply", ctx.ticket.id, tone);
  const cached   = getCached(cacheKey);
  if (cached) {
    await trackUsage({
      orgId: ctx.org.id, feature: "reply", provider: "openai", model: "",
      tokensUsed: 0, promptTokens: 0, completionTokens: 0, latencyMs: 0,
      estimatedCostUsd: 0, userId, ticketId: ctx.ticket.id, cached: true,
    } as AIUsageRecord);
    return { text: cached, cached: true };
  }

  const ctxWithSafeTitle = { ...ctx, ticket: { ...ctx.ticket, title: safeTitle } };
  const { system, user } = buildReplyPrompt(ctxWithSafeTitle, tone);

  const result = await callAIProvider(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { maxTokens: 1024 }
  );

  setCached(cacheKey, result.text);

  const usage: AIUsageRecord = {
    orgId:            ctx.org.id,
    feature:          "reply",
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

  return { text: result.text, cached: false };
}
