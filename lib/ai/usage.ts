import { prisma } from "@/lib/prisma";
import { canUseAI, canUseFeature, featureRequiresPlan } from "@/lib/plans";
import type { OrgPlan } from "@/lib/generated/prisma/client";
import type { PlanFeature } from "@/lib/plans";
import type { AIUsageRecord } from "./types";

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

/**
 * Checks both plan-tier feature access and monthly quota in one call.
 * Returns { allowed: false, reason } when either gate fails.
 */
export async function checkAIAccess(
  orgId:   string,
  plan:    string | OrgPlan,
  feature: PlanFeature
): Promise<{ allowed: boolean; reason?: string; usage?: number }> {
  if (!canUseFeature(plan as OrgPlan, feature)) {
    return {
      allowed: false,
      reason:  `This feature requires the ${featureRequiresPlan(feature)} plan or higher.`,
    };
  }
  const { allowed, usage } = await checkAILimits(orgId, plan);
  if (!allowed) {
    return { allowed: false, reason: "Monthly AI usage limit reached. Upgrade your plan.", usage };
  }
  return { allowed: true, usage };
}

export async function checkAILimits(
  orgId:    string,
  plan:     string | OrgPlan
): Promise<{ allowed: boolean; usage: number }> {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const usage = await prisma.aiUsageLog.count({
    where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
  });

  const allowed = canUseAI(plan as OrgPlan, usage);
  return { allowed, usage };
}

export async function trackUsage(record: AIUsageRecord): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        organizationId:    record.orgId,
        feature:           record.feature,
        provider:          record.provider,
        model:             record.model,
        tokensUsed:        record.tokensUsed,
        promptTokens:      record.promptTokens,
        completionTokens:  record.completionTokens,
        latencyMs:         record.latencyMs,
        estimatedCostUsd:  record.estimatedCostUsd,
        userId:            record.userId   ?? null,
        ticketId:          record.ticketId ?? null,
        cached:            record.cached,
      },
    });
  } catch {
    // Usage tracking failure is non-fatal
  }
}

export async function getMonthlyStats(orgId: string) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return prisma.aiUsageLog.findMany({
    where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
    select: {
      feature: true, tokensUsed: true, estimatedCostUsd: true, cached: true,
      latencyMs: true, provider: true, model: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
