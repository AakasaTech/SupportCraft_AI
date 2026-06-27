"use client";

import { Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { PLAN_NAMES, PLAN_PRICES } from "@/lib/plans";
import type { OrgPlan } from "@/types/database";

const PLAN_FEATURES: Record<OrgPlan, string[]> = {
  free: [
    "Up to 3 agents",
    "100 tickets/month",
    "50 AI suggestions/month",
    "20 knowledge articles",
    "Email support",
  ],
  pro: [
    "Up to 15 agents",
    "Unlimited tickets",
    "1,000 AI suggestions/month",
    "200 knowledge articles",
    "Priority support",
    "Custom categories & tags",
  ],
  business: [
    "Unlimited agents",
    "Unlimited tickets",
    "Unlimited AI usage",
    "Unlimited knowledge articles",
    "Dedicated support",
    "Custom integrations",
    "SLA guarantees",
  ],
};

interface PlanCardsProps {
  currentPlan: OrgPlan;
  orgId: string;
}

export function PlanCards({ currentPlan, orgId }: PlanCardsProps) {
  const plans: OrgPlan[] = ["free", "pro", "business"];

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
        vault: true,
        intent: "subscription",
      }}
    >
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrentPlan = plan === currentPlan;
          const planId = plan === "pro"
            ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_PRO
            : process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_BUSINESS;

          return (
            <Card
              key={plan}
              className={`relative ${plan === "pro" ? "border-primary shadow-md" : ""}`}
            >
              {plan === "pro" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>Most Popular</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{PLAN_NAMES[plan]}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    ${PLAN_PRICES[plan]}
                  </span>
                  {PLAN_PRICES[plan] > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {PLAN_FEATURES[plan].map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <div className="w-full text-center py-2 rounded-md bg-muted text-muted-foreground text-sm font-medium">
                    Current plan
                  </div>
                ) : plan === "free" ? (
                  <div className="w-full text-center py-2 rounded-md border text-muted-foreground text-sm">
                    Downgrade on cancellation
                  </div>
                ) : (
                  planId && (
                    <PayPalButtons
                      style={{ layout: "vertical", label: "subscribe" }}
                      createSubscription={(data, actions) => {
                        return actions.subscription.create({
                          plan_id: planId,
                          custom_id: orgId,
                        });
                      }}
                      onApprove={async () => {
                        window.location.reload();
                      }}
                    />
                  )
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </PayPalScriptProvider>
  );
}
