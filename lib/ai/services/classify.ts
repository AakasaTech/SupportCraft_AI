import { callAIProvider }      from "../provider";
import { buildClassifyPrompt } from "../prompts/classify";
import { estimateCost, trackUsage } from "../usage";
import type { ClassificationResult, SentimentResult, AIUsageRecord } from "../types";

interface FullClassification extends ClassificationResult {
  sentimentScore:       number;
  sentimentExplanation: string;
}

export async function classifyTicket(
  ticketId:    string,
  orgId:       string,
  title:       string,
  description: string,
  userId?:     string
): Promise<{ classification: ClassificationResult; sentiment: SentimentResult }> {
  const { system, user } = buildClassifyPrompt(title, description);

  const result = await callAIProvider(
    [{ role: "system", content: system }, { role: "user", content: user }],
    { maxTokens: 300 }
  );

  let parsed: FullClassification;
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? result.text) as FullClassification;
  } catch {
    parsed = {
      priority:             "medium",
      category:             "General",
      tags:                 [],
      sentiment:            "neutral",
      sentimentScore:       0.5,
      sentimentExplanation: "Could not determine sentiment",
    };
  }

  const usage: AIUsageRecord = {
    orgId,
    feature:          "classify",
    provider:         result.provider,
    model:            result.model,
    tokensUsed:       result.tokensUsed,
    promptTokens:     result.promptTokens,
    completionTokens: result.completionTokens,
    latencyMs:        result.latencyMs,
    estimatedCostUsd: estimateCost(result.model, result.promptTokens, result.completionTokens),
    userId,
    ticketId,
    cached:           false,
  };
  await trackUsage(usage);

  return {
    classification: {
      priority:   parsed.priority ?? "medium",
      category:   parsed.category ?? "General",
      tags:       Array.isArray(parsed.tags) ? parsed.tags : [],
      sentiment:  parsed.sentiment,
    },
    sentiment: {
      label:       parsed.sentiment ?? "neutral",
      score:       parsed.sentimentScore ?? 0.5,
      explanation: parsed.sentimentExplanation ?? "",
    },
  };
}
