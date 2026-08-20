import type { ElementType } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowUp, Minus, ArrowDown } from "lucide-react";
import type { TicketPriority } from "@/lib/generated/prisma/client";

const CONFIG: Record<TicketPriority, { label: string; cls: string; Icon: ElementType }> = {
  urgent: { label: "Urgent", cls: "bg-destructive-subtle text-destructive border-destructive/20", Icon: AlertTriangle },
  high:   { label: "High",   cls: "bg-warning-subtle text-warning-foreground border-amber-200",   Icon: ArrowUp       },
  medium: { label: "Medium", cls: "bg-primary-subtle text-primary border-primary/20",             Icon: Minus         },
  low:    { label: "Low",    cls: "bg-muted text-muted-foreground border-border",                 Icon: ArrowDown     },
};

interface Props {
  priority: TicketPriority;
  size?: "sm" | "md";
  showIcon?: boolean;
  className?: string;
}

export function PriorityBadge({ priority, size = "md", showIcon = true, className }: Props) {
  const { label, cls, Icon } = CONFIG[priority] ?? CONFIG.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium border rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        cls,
        className
      )}
    >
      {showIcon && <Icon size={size === "sm" ? 9 : 10} className="shrink-0" />}
      {label}
    </span>
  );
}

export const ALL_PRIORITIES: TicketPriority[] = ["urgent", "high", "medium", "low"];
