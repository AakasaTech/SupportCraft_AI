import Link from "next/link";
import { ExternalLink, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAssignedTickets } from "@/lib/dashboard/queries";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TicketCheck } from "lucide-react";

interface Props {
  orgId:  string;
  userId: string;
}

const STATUS_PILL: Record<string, string> = {
  open:     "bg-primary-subtle text-primary",
  pending:  "bg-warning-subtle text-warning-foreground",
  resolved: "bg-success-subtle text-success",
  closed:   "bg-muted text-muted-foreground",
};

const PRIORITY_PILL: Record<string, string> = {
  urgent: "bg-destructive-subtle text-destructive font-semibold",
  high:   "bg-warning-subtle text-warning-foreground",
  medium: "bg-primary-subtle text-primary",
  low:    "bg-muted text-muted-foreground",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export async function AssignedTicketsWidget({ orgId, userId }: Props) {
  const tickets = await getAssignedTickets(orgId, userId);

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Assigned to Me</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your open & pending tickets</p>
        </div>
        <Link
          href="/tickets?filter=mine"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ExternalLink size={11} />
        </Link>
      </div>

      {!tickets.length ? (
        <div className="p-6">
          <EmptyState
            icon={TicketCheck}
            title="All clear!"
            description="No tickets assigned to you right now."
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {tickets.map((t) => (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-hover transition-colors group"
            >
              {/* Priority indicator line */}
              <div className={cn(
                "w-1 h-8 rounded-full shrink-0",
                t.priority === "urgent" ? "bg-destructive" :
                t.priority === "high"   ? "bg-warning-foreground" :
                t.priority === "medium" ? "bg-primary" : "bg-muted-foreground/30"
              )} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {t.title}
                  </p>
                  {t.isOverdue && (
                    <AlertCircle size={13} className="text-destructive shrink-0" aria-label="Overdue" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.customerName}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", PRIORITY_PILL[t.priority])}>
                  {t.priority}
                </span>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full capitalize", STATUS_PILL[t.status])}>
                  {t.status}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 min-w-[50px] justify-end">
                  <Clock size={10} />
                  {timeAgo(t.updatedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
