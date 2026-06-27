import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentTicket {
  id: string;
  title: string;
  customer: string;
  status: "open" | "pending" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  updatedAt: string;
}

interface RecentTicketsProps {
  tickets: RecentTicket[];
  isLoading?: boolean;
  className?: string;
}

const statusClass: Record<RecentTicket["status"], string> = {
  open:     "sc-status-open",
  pending:  "sc-status-pending",
  resolved: "sc-status-resolved",
  closed:   "sc-status-closed",
};

const priorityClass: Record<RecentTicket["priority"], string> = {
  urgent: "sc-priority-urgent",
  high:   "sc-priority-high",
  medium: "sc-priority-medium",
  low:    "sc-priority-low",
};

export function RecentTickets({ tickets, isLoading, className }: RecentTicketsProps) {
  return (
    <div className={cn("sc-card overflow-hidden", className)}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Recent Tickets</h3>
        <Link
          href="/tickets"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors font-medium"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-3">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-48 rounded animate-skeleton" />
                <div className="h-3 w-24 rounded animate-skeleton" />
              </div>
              <div className="h-5 w-14 rounded-full animate-skeleton" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border" role="list">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/tickets/${ticket.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-hover transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {ticket.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{ticket.customer}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={10} aria-hidden />
                      {ticket.updatedAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", priorityClass[ticket.priority])}>
                    {ticket.priority}
                  </span>
                  <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", statusClass[ticket.status])}>
                    {ticket.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
