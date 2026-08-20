import type { OrgPlan } from "@/lib/generated/prisma/client";

// ─── Free pass resolution ─────────────────────────────────────────────────────

interface OrgWithFreepass {
  plan:           OrgPlan;
  freepass_plan:  string | null;
  freepass_until: string | null;
}

/**
 * Returns the effective plan for an org, honouring a free pass at highest priority.
 * Free passes with freepass_until=null are permanent; with a timestamp they expire.
 */
export function resolveEffectivePlan(org: OrgWithFreepass): OrgPlan {
  if (org.freepass_plan) {
    const expired = org.freepass_until && new Date(org.freepass_until) < new Date();
    if (!expired) {
      return org.freepass_plan as OrgPlan;
    }
  }
  return org.plan;
}

// ─── Runtime gating (tied to DB OrgPlan enum) ────────────────────────────────

const PLAN_LIMITS: Record<OrgPlan, {
  monthlyAICalls:    number;
  agents:            number;
  tickets:           number;
  knowledgeArticles: number;
}> = {
  free:     { monthlyAICalls: 50,       agents: 1,        tickets: 50,       knowledgeArticles: 10 },
  pro:      { monthlyAICalls: 2000,     agents: 5,        tickets: Infinity, knowledgeArticles: Infinity },
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
  free:     "Free",
  pro:      "Startup",
  business: "Business",
};

export const PLAN_PRICES: Record<OrgPlan, number> = {
  free:     0,
  pro:      19,
  business: 39,
};

// ─── Feature flags ────────────────────────────────────────────────────────────

export type PlanFeature =
  | "ai_summaries"
  | "ai_auto_categorize"
  | "ai_improve"
  | "ai_suggested_responses"
  | "ai_ticket_prioritization"
  | "ai_knowledge_search"
  | "internal_notes"
  | "ticket_assignment"
  | "file_attachments"
  | "saved_replies"
  | "ticket_tags"
  | "sla_policies"
  | "automation_rules"
  | "custom_fields"
  | "custom_branding"
  | "csat_surveys"
  | "advanced_reports"
  | "webhooks"
  | "full_api"
  | "sso";

const PRO_FEATURES: PlanFeature[] = [
  "ai_summaries", "ai_auto_categorize", "ai_improve",
  "internal_notes", "ticket_assignment", "file_attachments",
  "saved_replies", "ticket_tags", "sla_policies", "automation_rules",
  "custom_fields", "custom_branding",
];

const BUSINESS_FEATURES: PlanFeature[] = [
  ...PRO_FEATURES,
  "ai_suggested_responses", "ai_ticket_prioritization", "ai_knowledge_search",
  "csat_surveys", "advanced_reports", "webhooks", "full_api", "sso",
];

const PLAN_FEATURE_MAP: Record<OrgPlan, Set<PlanFeature>> = {
  free:     new Set([]),
  pro:      new Set(PRO_FEATURES),
  business: new Set(BUSINESS_FEATURES),
};

export function canUseFeature(plan: OrgPlan, feature: PlanFeature): boolean {
  return PLAN_FEATURE_MAP[plan].has(feature);
}

/** Returns the minimum plan name that unlocks a feature, for upgrade prompts. */
export function featureRequiresPlan(feature: PlanFeature): string {
  if (PRO_FEATURES.includes(feature)) return "Startup";
  return "Business";
}

// ─── UI pricing plans (5-tier, for landing page & billing UI) ─────────────────

export interface PricingPlan {
  id:                  string;
  name:                string;
  badge:               string | null;
  monthlyPrice:        number;
  yearlyPrice:         number | null;
  yearlySavings:       number | null;
  description:         string;
  features:            string[];
  cta:                 string;
  ctaHref:             string;
  highlighted:         boolean;
  free:                boolean;
  paypalMonthlyPlanId: string | null;
  paypalYearlyPlanId:  string | null;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id:            "free",
    name:          "Free",
    badge:         null,
    monthlyPrice:  0,
    yearlyPrice:   null,
    yearlySavings: null,
    description:   "Get started at no cost. No credit card required.",
    features: [
      "1 Agent",
      "50 Tickets/month",
      "Email support",
      "Customer portal",
      "Knowledge base",
      "Basic AI replies",
      "Community support",
    ],
    cta:                 "Start Free",
    ctaHref:             "/register",
    highlighted:         false,
    free:                true,
    paypalMonthlyPlanId: null,
    paypalYearlyPlanId:  null,
  },
  {
    id:            "freelancer",
    name:          "Freelancer",
    badge:         "Best for Solo Professionals",
    monthlyPrice:  9,
    yearlyPrice:   89,
    yearlySavings: 19,
    description:   "Everything a solo professional needs to handle customer support.",
    features: [
      "1 Agent",
      "Unlimited customers",
      "Unlimited tickets",
      "Email ticketing",
      "Customer portal",
      "Knowledge base",
      "AI draft replies",
      "AI ticket summaries",
      "Saved replies",
      "Ticket tags",
      "File attachments",
      "Basic reports",
      "Email notifications",
    ],
    cta:                 "Start Freelancer Plan",
    ctaHref:             "/register",
    highlighted:         false,
    free:                false,
    paypalMonthlyPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_MONTHLY ?? null,
    paypalYearlyPlanId:  process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_FREELANCER_YEARLY  ?? null,
  },
  {
    id:            "startup",
    name:          "Startup",
    badge:         "Most Popular",
    monthlyPrice:  19,
    yearlyPrice:   189,
    yearlySavings: 39,
    description:   "The complete toolkit for a growing support team.",
    features: [
      "5 Agents",
      "Everything in Freelancer",
      "AI auto categorisation",
      "SLA policies",
      "Automation rules",
      "Internal notes",
      "Team inbox",
      "Custom fields",
      "Ticket assignment",
      "Collision detection",
      "Custom branding",
      "Basic API",
      "Web widget",
    ],
    cta:                 "Start Startup Plan",
    ctaHref:             "/register",
    highlighted:         true,
    free:                false,
    paypalMonthlyPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO      ?? null,
    paypalYearlyPlanId:  process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO_YEARLY ?? null,
  },
  {
    id:            "business",
    name:          "Business",
    badge:         "Best for Growing Teams",
    monthlyPrice:  39,
    yearlyPrice:   389,
    yearlySavings: 79,
    description:   "Advanced AI and workflows for high-volume teams.",
    features: [
      "15 Agents",
      "Everything in Startup",
      "Unlimited automations",
      "AI assistant",
      "AI knowledge search",
      "AI suggested responses",
      "AI ticket prioritisation",
      "Multiple mailboxes",
      "Multiple departments",
      "CSAT surveys",
      "Advanced reports",
      "Custom roles",
      "SSO",
      "Webhooks",
      "Full API",
      "Priority support",
    ],
    cta:                 "Start Business Plan",
    ctaHref:             "/register",
    highlighted:         false,
    free:                false,
    paypalMonthlyPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS         ?? null,
    paypalYearlyPlanId:  process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS_YEARLY  ?? null,
  },
  {
    id:            "agency",
    name:          "Agency",
    badge:         "For Agencies & MSPs",
    monthlyPrice:  79,
    yearlyPrice:   789,
    yearlySavings: 159,
    description:   "Manage multiple clients from one powerful platform.",
    features: [
      "Unlimited agents",
      "Everything in Business",
      "Multiple organisations",
      "White-label portals",
      "Unlimited customer portals",
      "Custom domains",
      "AI automation",
      "Client workspaces",
      "Team permissions",
      "Audit logs",
      "Priority support",
      "Early access features",
    ],
    cta:                 "Start Agency Plan",
    ctaHref:             "/register",
    highlighted:         false,
    free:                false,
    paypalMonthlyPlanId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY         ?? null,
    paypalYearlyPlanId:  process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_AGENCY_YEARLY  ?? null,
  },
];
