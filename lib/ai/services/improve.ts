import { callAIProvider }      from "../provider";
import { buildImprovePrompt }  from "../prompts/improve";
import { estimateCost, trackUsage } from "../usage";
import type { ImprovementAction, AIUsageRecord } from "../types";

export async function improveText(
  text:    string,
  action:  ImprovementAction,
  orgId:   string,
  userId?: string
): Promise<string> {
  const { system, user } = buildImprovePrompt(text, action);

  const result = await callAIProvider(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { maxTokens: 1024 }
  );

  const usage: AIUsageRecord = {
    orgId,
    feature:          "improve",
    provider:         result.provider,
    model:            result.model,
    tokensUsed:       result.tokensUsed,
    promptTokens:     result.promptTokens,
    completionTokens: result.completionTokens,
    latencyMs:        result.latencyMs,
    estimatedCostUsd: estimateCost(result.model, result.promptTokens, result.completionTokens),
    userId,
    cached:           false,
  };
  await trackUsage(usage);

  return result.text;
}
