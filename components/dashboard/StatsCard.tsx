import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
  };
  variant?: "default" | "primary" | "success" | "warning" | "destructive";
  isLoading?: boolean;
  className?: string;
}

const variantConfig = {
  default:     { iconBg: "bg-muted",              iconColor: "text-muted-foreground" },
  primary:     { iconBg: "bg-primary-subtle",      iconColor: "text-primary" },
  success:     { iconBg: "bg-success-subtle",      iconColor: "text-success" },
  warning:     { iconBg: "bg-warning-subtle",      iconColor: "text-warning-foreground" },
  destructive: { iconBg: "bg-destructive-subtle",  iconColor: "text-destructive" },
};

const trendConfig = {
  up:      { Icon: TrendingUp,   color: "text-success" },
  down:    { Icon: TrendingDown, color: "text-destructive" },
  neutral: { Icon: Minus,        color: "text-muted-foreground" },
};

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  isLoading,
  className,
}: StatsCardProps) {
  const { iconBg, iconColor } = variantConfig[variant];

  if (isLoading) {
    return (
      <div className={cn("sc-card p-5 space-y-3", className)}>
        <div className="flex items-start justify-between">
          <div className="h-9 w-9 rounded-lg animate-skeleton" />
        </div>
        <div className="space-y-1.5">
          <div className="h-7 w-20 rounded animate-skeleton" />
          <div className="h-4 w-32 rounded animate-skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("sc-card p-5 hover:elevation-md transition-shadow", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground tracking-tight">
            {value}
          </p>
          {(description || trend) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <div className={cn("flex items-center gap-1 text-xs font-medium", trendConfig[trend.direction].color)}>
                  {(() => {
                    const TrendIcon = trendConfig[trend.direction].Icon;
                    return <TrendIcon size={12} aria-hidden />;
                  })()}
                  {trend.direction !== "neutral" ? `${Math.abs(trend.value)}%` : "No change"}
                </div>
              )}
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl shrink-0", iconBg)}>
            <Icon size={18} className={iconColor} aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}
