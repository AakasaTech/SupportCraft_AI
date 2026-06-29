import Link from "next/link";
import { Lock } from "lucide-react";
import { canUseFeature, featureRequiresPlan } from "@/lib/plans";
import type { OrgPlan } from "@/types/database";
import type { PlanFeature } from "@/lib/plans";

interface PlanGateProps {
  plan:        OrgPlan;
  feature:     PlanFeature;
  children:    React.ReactNode;
  /** If true, renders children but visually disabled + overlay. Default: false (hides children). */
  overlay?:    boolean;
}

/**
 * Wraps a feature that requires a specific plan tier.
 * Shows an upgrade prompt when the org's plan doesn't include the feature.
 */
export function PlanGate({ plan, feature, children, overlay = false }: PlanGateProps) {
  if (canUseFeature(plan, feature)) {
    return <>{children}</>;
  }

  const requiredPlan = featureRequiresPlan(feature);

  if (overlay) {
    return (
      <div className="relative">
        <div className="pointer-events-none select-none opacity-40 blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60 backdrop-blur-sm">
          <UpgradeBadge requiredPlan={requiredPlan} />
        </div>
      </div>
    );
  }

  return <UpgradeBadge requiredPlan={requiredPlan} />;
}

function UpgradeBadge({ requiredPlan }: { requiredPlan: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Lock className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {requiredPlan} plan required
        </p>
        <p className="text-xs text-muted-foreground">
          Upgrade to unlock this feature.
        </p>
      </div>
      <Link
        href="/settings/billing"
        className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Upgrade
      </Link>
    </div>
  );
}
