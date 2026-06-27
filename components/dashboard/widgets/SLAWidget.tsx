import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSlaTickets } from "@/lib/dashboard/queries";

interface Props {
  orgId: string;
}

function urgencyLabel(hoursOverdue: number): { label: string; cls: string } {
  if (hoursOverdue >= 24) return { label: "Critical",  cls: "text-destructive bg-destructive-subtle" };
  if (hoursOverdue >= 8)  return { label: "Overdue",   cls: "text-destructive bg-destructive-subtle" };
  if (hoursOverdue >= 0)  return { label: "At Risk",   cls: "text-warning-foreground bg-warning-subtle" };
  return                         { label: "Breaching", cls: "text-warning-foreground bg-warning-subtle" };
}

export async function SLAWidget({ orgId }: Props) {
  const tickets = await getSlaTickets(orgId);
  const critical = tickets.filter((t) => t.hoursOverdue >= 8).length;

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          {critical > 0 ? (
            <div className="relative">
              <AlertTriangle size={15} className="text-destructive" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
                {critical > 9 ? "9+" : critical}
              </span>
            </div>
          ) : (
            <Clock size={15} className="text-primary" />
          )}
          <div>
            <h3 className="text-sm font-semibold">SLA Monitoring</h3>
            <p className="text-xs text-muted-foreground mt-0.5">At-risk & overdue tickets</p>
          </div>
        </div>
        <Link
          href="/tickets?filter=sla"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          View all <ExternalLink size={11} />
        </Link>
      </div>

      {!tickets.length ? (
        <div className="p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm font-medium">All tickets within SLA</p>
          <p className="text-xs text-muted-foreground mt-1">No tickets at risk right now.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {tickets.map((t) => {
            const { label, cls } = urgencyLabel(t.hoursOverdue);
            return (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-hover transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {t.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.customerName}
                    {t.assigneeName && <> · <span className="text-foreground">{t.assigneeName}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", cls)}>
                    {label}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock size={10} />
                    {t.hoursOverdue >= 0
                      ? `${t.hoursOverdue.toFixed(0)}h over`
                      : `${Math.abs(t.hoursOverdue).toFixed(0)}h left`}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
