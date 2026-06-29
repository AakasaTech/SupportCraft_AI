import { Sparkles } from "lucide-react";
import { AIBadge } from "./AIBadge";
import { cn } from "@/lib/utils";
import type { OrgPlan } from "@/types/database";

interface AISummaryPanelProps {
  summary: string;
  keyPoints?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  isLoading?: boolean;
  className?: string;
}

const sentimentConfig = {
  positive: { label: "Positive", className: "text-success bg-success-subtle" },
  neutral:  { label: "Neutral",  className: "text-muted-foreground bg-muted" },
  negative: { label: "Negative", className: "text-destructive bg-destructive-subtle" },
};

export function AISummaryPanel({
  summary,
  keyPoints,
  sentiment,
  isLoading,
  className,
}: AISummaryPanelProps) {
  return (
    <div className={cn("rounded-xl border border-ai-border bg-ai-subtle/40 p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-ai" />
          <span className="text-sm font-medium text-foreground">AI Summary</span>
        </div>
        {sentiment && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              sentimentConfig[sentiment].className
            )}
          >
            {sentimentConfig[sentiment].label}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3.5 bg-muted rounded animate-skeleton w-full" />
          <div className="h-3.5 bg-muted rounded animate-skeleton w-5/6" />
          <div className="h-3.5 bg-muted rounded animate-skeleton w-3/4" />
        </div>
      ) : (
        <p className="text-sm text-foreground leading-relaxed">{summary}</p>
      )}

      {keyPoints && keyPoints.length > 0 && !isLoading && (
        <ul className="space-y-1.5">
          {keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-ai shrink-0" />
              {point}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface AISuggestionCardProps {
  title: string;
  description: string;
  onApply?: () => void;
  className?: string;
}

export function AISuggestionCard({
  title,
  description,
  onApply,
  className,
}: AISuggestionCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-ai-border bg-ai-subtle/30 px-3 py-2.5",
        className
      )}
    >
      <Sparkles size={14} className="text-ai mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      {onApply && (
        <button
          onClick={onApply}
          className="shrink-0 text-xs font-medium text-ai hover:text-ai/80 transition-colors"
        >
          Apply
        </button>
      )}
    </div>
  );
}

interface AIUsageMeterProps {
  used: number;
  limit: number;
  plan: OrgPlan;
  className?: string;
}

export function AIUsageMeter({ used, limit, plan, className }: AIUsageMeterProps) {
  const isUnlimited = limit === Infinity;
  const pct = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isWarning = pct > 75;
  const isDanger  = pct > 90;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <AIBadge size="sm" />
          <span className="text-xs text-muted-foreground">Usage this month</span>
        </div>
        <span className="text-xs font-medium text-foreground">
          {isUnlimited ? `${used.toLocaleString()} / ∞` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>

      {!isUnlimited && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isDanger  ? "bg-destructive" :
              isWarning ? "bg-warning" :
              "sc-gradient-ai"
            )}
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={limit}
          />
        </div>
      )}

      {isWarning && !isDanger && (
        <p className="text-xs text-warning-foreground">
          Approaching monthly AI call limit.
        </p>
      )}
      {isDanger && (
        <p className="text-xs text-destructive">
          Almost at your limit. Consider upgrading your plan.
        </p>
      )}
    </div>
  );
}
