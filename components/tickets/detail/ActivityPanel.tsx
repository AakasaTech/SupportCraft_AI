import { Clock } from "lucide-react";
import { getActivityLog } from "@/features/tickets/lib/queries";
import type { AuditLog } from "@/lib/generated/prisma/client";

interface Props {
  ticketId: string;
}

function timeAgo(iso: string | Date): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function eventLabel(event: string, metadata: unknown): string {
  const meta = metadata as Record<string, unknown> | null;
  switch (event) {
    case "ticket.created":       return "Ticket created";
    case "ticket.status_changed":
      return `Status changed to ${meta?.newStatus ?? "unknown"}`;
    case "ticket.replied":
      return meta?.isInternal ? "Internal note added" : "Reply sent";
    case "ticket.deleted":       return "Ticket deleted";
    case "ticket.assigned":
      return `Assigned to ${meta?.assigneeName ?? "agent"}`;
    default:
      return event.replace(/[._]/g, " ");
  }
}

export async function ActivityPanel({ ticketId }: Props) {
  const logs = await getActivityLog(ticketId);

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</h3>
      </div>

      {!logs.length ? (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">No activity logged yet.</p>
        </div>
      ) : (
        <ol className="relative border-l border-border ml-6 mr-4 my-3 space-y-0">
          {(logs as AuditLog[]).map((log) => (
            <li key={log.id} className="relative pb-3 pl-4">
              <span className="absolute -left-1.5 top-0.5 w-3 h-3 rounded-full bg-muted border-2 border-background" />
              <p className="text-xs font-medium leading-snug">
                {eventLabel(log.event, log.metadata)}
              </p>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Clock size={9} />
                {timeAgo(log.createdAt)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
