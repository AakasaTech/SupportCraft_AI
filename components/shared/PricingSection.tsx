"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_PLANS, type PricingPlan } from "@/lib/plans";

// ─── Billing toggle ───────────────────────────────────────────────────────────

function BillingToggle({ yearly, onChange }: { yearly: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => onChange(false)}
        className={`text-sm font-medium transition-colors ${
          !yearly ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Monthly
      </button>

      <button
        onClick={() => onChange(!yearly)}
        aria-label="Toggle billing cycle"
        className="relative flex h-6 w-11 shrink-0 items-center rounded-full border border-border bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={yearly ? { background: "oklch(0.42 0.18 264)", borderColor: "oklch(0.42 0.18 264)" } : undefined}
      >
        <span
          className="absolute h-4 w-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: yearly ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(true)}
          className={`text-sm font-medium transition-colors ${
            yearly ? "text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Yearly
        </button>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: "oklch(0.42 0.18 264 / 0.10)",
            color:      "oklch(0.42 0.18 264)",
          }}
        >
          Save up to 20%
        </span>
      </div>
    </div>
  );
}

// ─── Single plan card ─────────────────────────────────────────────────────────

function PlanCard({ plan, yearly }: { plan: PricingPlan; yearly: boolean }) {
  const price   = yearly && plan.yearlyPrice !== null ? plan.yearlyPrice : plan.monthlyPrice;
  const period  = plan.monthlyPrice === 0 ? "forever" : yearly ? "/year" : "/month";
  const isFree  = plan.free;
  const isPop   = plan.highlighted;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-shadow ${
        isPop
          ? "shadow-xl"
          : isFree
            ? "border-border/60 bg-card/60"
            : "border-border bg-card shadow-sm hover:shadow-md"
      }`}
      style={isPop ? {
        borderColor: "oklch(0.42 0.18 264)",
        borderWidth:  "2px",
        background:   "linear-gradient(160deg, oklch(0.42 0.18 264 / 0.04) 0%, transparent 60%)",
      } : undefined}
    >
      {/* Badge */}
      {plan.badge && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-0.5 text-[11px] font-semibold"
          style={isPop ? {
            background: "linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.52 0.22 280) 100%)",
            color:      "oklch(0.99 0 0)",
          } : {
            background: "oklch(0.42 0.18 264 / 0.10)",
            color:      "oklch(0.42 0.18 264)",
            border:     "1px solid oklch(0.42 0.18 264 / 0.20)",
          }}
        >
          {plan.badge}
        </div>
      )}

      {/* Plan name */}
      <h3 className={`text-base font-bold ${isFree ? "text-muted-foreground" : "text-foreground"}`}>
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className={`text-3xl font-bold tabular-nums ${isFree ? "text-muted-foreground" : "text-foreground"}`}>
          {plan.monthlyPrice === 0 ? "$0" : `$${price}`}
        </span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>

      {/* Yearly savings label */}
      {yearly && plan.yearlySavings !== null && (
        <p className="mt-1 text-xs text-muted-foreground">
          Save ${plan.yearlySavings}/year
        </p>
      )}

      {/* Description */}
      <p className={`mt-3 text-xs leading-relaxed ${isFree ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
        {plan.description}
      </p>

      {/* Divider */}
      <hr className="my-5 border-border" />

      {/* Features */}
      <ul className="flex-1 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: isFree ? "oklch(0.65 0 0)" : "oklch(0.42 0.18 264)" }}
              strokeWidth={2.5}
            />
            <span className={isFree ? "text-muted-foreground" : "text-foreground/80"}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        href={plan.ctaHref}
        className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all ${
          isPop
            ? "text-white hover:opacity-90"
            : isFree
              ? "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
              : "border border-primary/30 bg-primary/8 text-primary hover:bg-primary/15"
        }`}
        style={isPop ? {
          background: "linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.52 0.22 280) 100%)",
        } : undefined}
      >
        {plan.cta}
      </Link>
    </div>
  );
}

// ─── Exported section ─────────────────────────────────────────────────────────

export function PricingSection() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="border-t border-border bg-muted/30 px-6 py-24">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing for modern support teams
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Start free, upgrade when your support team grows. AI-powered help desk tools for
            freelancers, startups, and small businesses.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mt-10">
          <BillingToggle yearly={yearly} onChange={setYearly} />
        </div>

        {/* Plan cards — 1 → 2 → 3 → 5 columns */}
        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PRICING_PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} yearly={yearly} />
          ))}
        </div>

        {/* Disclaimer */}
        <p className="mt-10 text-center text-xs text-muted-foreground">
          Prices are in USD. You can upgrade, downgrade, or cancel anytime.
        </p>

      </div>
    </section>
  );
}
