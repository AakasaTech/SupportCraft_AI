import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Variant = "default" | "primary" | "success" | "warning" | "destructive" | "ai";

interface TrendData {
  value:     number;
  direction: "up" | "down" | "neutral";
  label?:    string;
  good?:     "up" | "down"; // which direction is positive (default "up")
}

interface Props {
  title:       string;
  value:       string | number;
  icon:        LucideIcon;
  description?: string;
  trend?:      TrendData;
  badge?:      string;
  variant?:    Variant;
  isLoading?:  boolean;
  className?:  string;
}

const VARIANT_STYLES: Record<Variant, { iconBg: string; iconColor: string; border?: string }> = {
  default:     { iconBg: "bg-muted",              iconColor: "text-muted-foreground" },
  primary:     { iconBg: "bg-primary-subtle",     iconColor: "text-primary" },
  success:     { iconBg: "bg-success-subtle",     iconColor: "text-success" },
  warning:     { iconBg: "bg-warning-subtle",     iconColor: "text-warning-foreground", border: "border-warning/20" },
  destructive: { iconBg: "bg-destructive-subtle", iconColor: "text-destructive", border: "border-destructive/20" },
  ai:          { iconBg: "bg-ai-subtle",          iconColor: "text-ai" },
};

function TrendChip({ trend }: { trend: TrendData }) {
  const good       = trend.good ?? "up";
  const isPositive = trend.direction === good;
  const isNeutral  = trend.direction === "neutral";

  const Icon  = trend.direction === "up" ? TrendingUp : trend.direction === "down" ? TrendingDown : Minus;
  const color = isNeutral ? "text-muted-foreground" : isPositive ? "text-success" : "text-destructive";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", color)}>
      <Icon size={11} />
      {isNeutral ? "No change" : `${Math.abs(trend.value)}${trend.label ?? ""}`}
    </span>
  );
}

export function KpiCard({
  title, value, icon: Icon, description, trend, badge, variant = "default", isLoading, className,
}: Props) {
  const styles = VARIANT_STYLES[variant];

  if (isLoading) {
    return (
      <div className={cn("sc-card p-5 space-y-3", className)}>
        <div className="flex justify-between"><div className="h-10 w-10 rounded-xl animate-skeleton" /></div>
        <div className="space-y-1.5">
          <div className="h-7 w-20 rounded animate-skeleton" />
          <div className="h-4 w-32 rounded animate-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "sc-card p-5 hover:elevation-md transition-shadow relative",
      styles.border && `border ${styles.border}`,
      className,
    )}>
      {badge && (
        <span className="absolute top-3 right-3 text-[10px] font-semibold uppercase tracking-wide text-destructive bg-destructive-subtle px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">{title}</p>
          <p className="mt-1.5 text-3xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
          {(description || trend) && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {trend && <TrendChip trend={trend} />}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl shrink-0", styles.iconBg)}>
          <Icon size={20} className={styles.iconColor} aria-hidden />
        </div>
      </div>
    </div>
  );
}
