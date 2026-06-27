import { createAdminClient } from "@/lib/supabase/server";
import { canUseAI } from "@/lib/plans";
import type { OrgPlan } from "@/types/database";
import type { AIUsageRecord, AIProvider } from "./types";

// Cost per 1M tokens in USD
const COST_TABLE: Record<string, { input: number; output: number }> = {
  "gpt-4o":              { input: 2.50, output: 10.00 },
  "gpt-4o-mini":         { input: 0.15, output: 0.60  },
  "claude-sonnet-4-6":   { input: 3.00, output: 15.00 },
  "claude-haiku-4-5":    { input: 1.00, output: 5.00  },
};

export function estimateCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const rates = COST_TABLE[model];
  if (!rates) return 0;
  return (
    (promptTokens     / 1_000_000) * rates.input +
    (completionTokens / 1_000_000) * rates.output
  );
}

export async function checkAILimits(
  orgId:    string,
  plan:     string | OrgPlan
): Promise<{ allowed: boolean; usage: number }> {
  const admin = createAdminClient();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { count } = await admin
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .gte("created_at", startOfMonth);

  const usage   = count ?? 0;
  const allowed = canUseAI(plan as OrgPlan, usage);
  return { allowed, usage };
}

export async function trackUsage(record: AIUsageRecord): Promise<void> {
  const admin = createAdminClient();
  try {
    await admin.from("ai_usage_logs").insert({
      org_id:              record.orgId,
      feature:             record.feature,
      provider:            record.provider,
      model:               record.model,
      tokens_used:         record.tokensUsed,
      prompt_tokens:       record.promptTokens,
      completion_tokens:   record.completionTokens,
      latency_ms:          record.latencyMs,
      estimated_cost_usd:  record.estimatedCostUsd,
      user_id:             record.userId    ?? null,
      ticket_id:           record.ticketId  ?? null,
      cached:              record.cached,
    });
  } catch {
    // Usage tracking failure is non-fatal
  }
}

export async function getMonthlyStats(orgId: string) {
  const admin = createAdminClient();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data } = await admin
    .from("ai_usage_logs")
    .select("feature, tokens_used, estimated_cost_usd, cached, latency_ms, provider, model, created_at")
    .eq("org_id", orgId)
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  return data ?? [];
}
