import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIBadgeProps {
  label?: string;
  size?: "sm" | "md";
  className?: string;
  pulse?: boolean;
}

export function AIBadge({ label = "AI", size = "md", className, pulse }: AIBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        "sc-ai-badge",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        pulse && "sc-ai-pulse",
        className
      )}
    >
      <Sparkles
        size={size === "sm" ? 10 : 12}
        className="shrink-0"
        aria-hidden
      />
      {label}
    </span>
  );
}
