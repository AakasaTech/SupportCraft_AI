import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shared/Header";
import { PlanCards } from "@/features/billing/components/PlanCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_NAMES } from "@/lib/plans";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const [{ data: org }, { data: subscription }] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, plan")
      .eq("id", profile.org_id)
      .single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("org_id", profile.org_id)
      .single(),
  ]);

  if (!org) redirect("/login");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const { count: aiUsageThisMonth } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("org_id", profile.org_id)
    .gte("created_at", startOfMonth);

  return (
    <div>
      <Header title="Billing & Plans" description="Manage your subscription" />
      <div className="p-6 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge className="text-sm px-3 py-1">{PLAN_NAMES[org.plan as keyof typeof PLAN_NAMES]}</Badge>
              {subscription?.status && (
                <span className="text-sm text-muted-foreground capitalize">
                  {subscription.status}
                </span>
              )}
            </div>
            {subscription?.current_period_end && (
              <p className="text-sm text-muted-foreground">
                Renews {formatDate(subscription.current_period_end)}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              AI usage this month: {aiUsageThisMonth ?? 0} calls
            </p>
          </CardContent>
        </Card>

        <PlanCards currentPlan={org.plan} orgId={org.id} />
      </div>
    </div>
  );
}
