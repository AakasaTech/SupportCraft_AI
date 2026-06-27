import { Badge } from "@/components/ui/badge";
import type { TicketStatus, TicketPriority } from "@/types/database";

const STATUS_CONFIG: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  new:         { label: "New",         variant: "outline"     },
  open:        { label: "Open",        variant: "default"     },
  in_progress: { label: "In Progress", variant: "default"     },
  pending:     { label: "Pending",     variant: "warning"     },
  resolved:    { label: "Resolved",    variant: "success"     },
  closed:      { label: "Closed",      variant: "secondary"   },
};

const PRIORITY_CONFIG: Record<TicketPriority, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }> = {
  low: { label: "Low", variant: "secondary" },
  medium: { label: "Medium", variant: "outline" },
  high: { label: "High", variant: "warning" },
  urgent: { label: "Urgent", variant: "destructive" },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant as Parameters<typeof Badge>[0]["variant"]}>{config.label}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return <Badge variant={config.variant as Parameters<typeof Badge>[0]["variant"]}>{config.label}</Badge>;
}
