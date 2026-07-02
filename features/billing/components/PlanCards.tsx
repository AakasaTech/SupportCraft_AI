"use client";

import { useState } from "react";
import { Check, AlertCircle } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { PRICING_PLANS, type PricingPlan } from "@/lib/plans";
import type { OrgPlan } from "@/types/database";

// Map DB plan values to display plan IDs for "Current plan" highlighting
const DB_TO_PRICING_ID: Record<OrgPlan, string> = {
  free:     "free",
  pro:      "startup",
  business: "business",
};

interface PlanCardsProps {
  currentPlan: OrgPlan;
  orgId:       string;
}

export function PlanCards({ currentPlan, orgId }: PlanCardsProps) {
  const [yearly, setYearly] = useState(false);
  const currentPricingId = DB_TO_PRICING_ID[currentPlan];

  return (
    <PayPalScriptProvider
      options={{
        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ?? "",
        vault:    true,
        intent:   "subscription",
      }}
    >
      <div className="space-y-6">

        {/* Billing toggle */}
        <div className="flex items-center gap-4">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted-foreground"}`}>
            Monthly
          </span>
          <button
            onClick={() => setYearly(!yearly)}
            aria-label="Toggle billing cycle"
            className="relative flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              background:  yearly ? "hsl(var(--primary))" : "hsl(var(--muted))",
              borderColor: yearly ? "hsl(var(--primary))" : "hsl(var(--border))",
            }}
          >
            <span
              className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: yearly ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted-foreground"}`}>
              Yearly
            </span>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
              Save up to 20%
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PRICING_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              yearly={yearly}
              isCurrent={plan.id === currentPricingId}
              orgId={orgId}
            />
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Prices are in USD. Upgrade, downgrade, or cancel anytime.
        </p>
      </div>
    </PayPalScriptProvider>
  );
}

// ─── Single plan card ─────────────────────────────────────────────────────────

function PlanCard({
  plan,
  yearly,
  isCurrent,
  orgId,
}: {
  plan:      PricingPlan;
  yearly:    boolean;
  isCurrent: boolean;
  orgId:     string;
}) {
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [{ isPending }] = usePayPalScriptReducer();

  const price  = yearly && plan.yearlyPrice !== null ? plan.yearlyPrice : plan.monthlyPrice;
  const period = plan.monthlyPrice === 0 ? "forever" : yearly ? "/year" : "/month";
  const planId = yearly ? plan.paypalYearlyPlanId : plan.paypalMonthlyPlanId;

  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 transition-shadow ${
        plan.highlighted
          ? "shadow-lg"
          : plan.free
            ? "border-border/60 bg-muted/30"
            : "border-border bg-card"
      } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}
      style={plan.highlighted ? {
        borderColor: "hsl(var(--primary))",
        borderWidth:  "2px",
      } : undefined}
    >
      {/* Badge */}
      {plan.badge && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground">
          {plan.badge}
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-green-600 px-3 py-0.5 text-[10px] font-semibold text-white">
          Current plan
        </div>
      )}

      {/* Name + price */}
      <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">
          {plan.monthlyPrice === 0 ? "$0" : `$${price}`}
        </span>
        <span className="text-xs text-muted-foreground">{period}</span>
      </div>
      {yearly && plan.yearlySavings !== null && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">Save ${plan.yearlySavings}/year</p>
      )}

      <hr className="my-4 border-border" />

      {/* Features */}
      <ul className="flex-1 space-y-2">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[11px]">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" strokeWidth={2.5} />
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-5">
        {isCurrent ? (
          <div className="w-full rounded-lg border border-border bg-muted py-2 text-center text-xs font-medium text-muted-foreground">
            Your current plan
          </div>
        ) : plan.free ? (
          <div className="w-full rounded-lg border border-border py-2 text-center text-xs text-muted-foreground">
            Downgrade on cancellation
          </div>
        ) : planId ? (
          <div>
            {isPending && (
              <div className="w-full rounded-lg bg-muted py-2 text-center text-xs text-muted-foreground animate-pulse">
                Loading payment…
              </div>
            )}
            {paypalError && (
              <div className="mb-2 flex items-start gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {paypalError}
              </div>
            )}
            <PayPalButtons
              style={{ layout: "vertical", label: "subscribe", height: 40 }}
              disabled={isPending}
              createSubscription={(_data, actions) => {
                setPaypalError(null);
                return actions.subscription.create({ plan_id: planId, custom_id: orgId });
              }}
              onApprove={async () => {
                window.location.href = window.location.pathname + "?subscribed=1";
              }}
              onError={(err) => {
                console.error("PayPal error:", err);
                setPaypalError("Payment failed. Please try again or contact support.");
              }}
            />
          </div>
        ) : (
          <a
            href="/register"
            className="block w-full rounded-lg border border-primary/30 bg-primary/8 py-2 text-center text-xs font-semibold text-primary hover:bg-primary/15 transition-colors"
          >
            {plan.cta}
          </a>
        )}
      </div>
    </div>
  );
}
