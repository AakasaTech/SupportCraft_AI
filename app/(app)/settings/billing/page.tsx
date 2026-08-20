import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/Header";
import { PlanCards } from "@/features/billing/components/PlanCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_NAMES, resolveEffectivePlan } from "@/lib/plans";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>;
}) {
  const { subscribed } = await searchParams;
  const user = await requireAuth();
  const orgId = user.profile.organizationId;
  const org = user.organization;

  const subscription = await prisma.subscription.findUnique({ where: { organizationId: orgId } });

  const effectivePlan = resolveEffectivePlan({
    plan: org.plan,
    freepass_plan: org.freepassPlan,
    freepass_until: org.freepassUntil?.toISOString() ?? null,
  });
  const hasFreepass = effectivePlan !== org.plan;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const aiUsageThisMonth = await prisma.aiUsageLog.count({
    where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
  });

  return (
    <div>
      <Header title="Billing & Plans" description="Manage your subscription" />
      <div className="p-6 space-y-8">
        {subscribed && (
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            <strong>Subscription activated!</strong> Your plan will update shortly. If it doesn&apos;t reflect below within a minute, refresh the page.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="text-sm px-3 py-1">{PLAN_NAMES[effectivePlan]}</Badge>
              {hasFreepass && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2.5 py-0.5 text-xs font-medium">
                  Free Pass
                </span>
              )}
              {subscription?.status && (
                <span className="text-sm text-muted-foreground capitalize">
                  {subscription.status}
                </span>
              )}
            </div>
            {subscription?.currentPeriodEnd && (
              <p className="text-sm text-muted-foreground">
                Renews {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              AI usage this month: {aiUsageThisMonth} calls
            </p>
          </CardContent>
        </Card>

        <PlanCards currentPlan={effectivePlan} orgId={org.id} />
      </div>
    </div>
  );
}
