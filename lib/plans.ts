import type { OrgPlan } from "@/types/database";

const PLAN_LIMITS: Record<OrgPlan, {
  monthlyAICalls: number;
  agents: number;
  tickets: number;
  knowledgeArticles: number;
}> = {
  free: { monthlyAICalls: 50, agents: 3, tickets: 100, knowledgeArticles: 20 },
  pro: { monthlyAICalls: 1000, agents: 15, tickets: Infinity, knowledgeArticles: 200 },
  business: { monthlyAICalls: Infinity, agents: Infinity, tickets: Infinity, knowledgeArticles: Infinity },
};

export function getPlanLimits(plan: OrgPlan) {
  return PLAN_LIMITS[plan];
}

export function canUseAI(plan: OrgPlan, usedThisMonth: number): boolean {
  return usedThisMonth < PLAN_LIMITS[plan].monthlyAICalls;
}

export function canAddAgent(plan: OrgPlan, currentCount: number): boolean {
  return currentCount < PLAN_LIMITS[plan].agents;
}

export const PLAN_NAMES: Record<OrgPlan, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
};

export const PLAN_PRICES: Record<OrgPlan, number> = {
  free: 0,
  pro: 29,
  business: 99,
};
