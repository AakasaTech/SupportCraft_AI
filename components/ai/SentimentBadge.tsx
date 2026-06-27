import { cn } from "@/lib/utils";
import type { SentimentLabel } from "@/lib/ai/types";

const CONFIG: Record<SentimentLabel, { label: string; className: string }> = {
  positive:   { label: "Positive",   className: "bg-success/10 text-success border-success/20" },
  satisfied:  { label: "Satisfied",  className: "bg-success/10 text-success border-success/20" },
  neutral:    { label: "Neutral",    className: "bg-muted text-muted-foreground border-border" },
  negative:   { label: "Negative",   className: "bg-destructive/10 text-destructive border-destructive/20" },
  frustrated: { label: "Frustrated", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

interface Props {
  sentiment: SentimentLabel | string;
  score?:    number;
  className?: string;
}

export function SentimentBadge({ sentiment, score, className }: Props) {
  const cfg = CONFIG[sentiment as SentimentLabel] ?? CONFIG.neutral;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border",
      cfg.className,
      className
    )}>
      {cfg.label}
      {score !== undefined && (
        <span className="opacity-60">{Math.round(score * 100)}%</span>
      )}
    </span>
  );
}
