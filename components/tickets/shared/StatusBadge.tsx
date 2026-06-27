import { cn } from "@/lib/utils";
import type { TicketStatus } from "@/types/database";

const CONFIG: Record<TicketStatus, { label: string; cls: string; dot: string }> = {
  new:         { label: "New",                cls: "bg-blue-50 text-blue-700 border-blue-200",        dot: "bg-blue-500" },
  open:        { label: "Open",               cls: "bg-primary-subtle text-primary border-primary/20", dot: "bg-primary" },
  in_progress: { label: "In Progress",        cls: "bg-violet-50 text-violet-700 border-violet-200",   dot: "bg-violet-500" },
  pending:     { label: "Waiting",            cls: "bg-warning-subtle text-warning-foreground border-amber-200", dot: "bg-amber-500" },
  resolved:    { label: "Resolved",           cls: "bg-success-subtle text-success border-green-200",  dot: "bg-green-500" },
  closed:      { label: "Closed",             cls: "bg-muted text-muted-foreground border-border",     dot: "bg-slate-400" },
};

interface Props {
  status: TicketStatus;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = "md", showDot = true, className }: Props) {
  const { label, cls, dot } = CONFIG[status] ?? CONFIG.open;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full",
        size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1",
        cls,
        className
      )}
    >
      {showDot && <span className={cn("rounded-full shrink-0", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2", dot)} />}
      {label}
    </span>
  );
}

export function statusLabel(status: TicketStatus): string {
  return CONFIG[status]?.label ?? status;
}

export const ALL_STATUSES: TicketStatus[] = ["new", "open", "in_progress", "pending", "resolved", "closed"];
