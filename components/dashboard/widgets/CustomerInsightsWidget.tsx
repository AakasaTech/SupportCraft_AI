import Link from "next/link";
import { ExternalLink, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCustomerInsights } from "@/lib/dashboard/queries";

interface Props {
  orgId: string;
}

export async function CustomerInsightsWidget({ orgId }: Props) {
  const customers = await getCustomerInsights(orgId);

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={15} className="text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Top Customers</h3>
            <p className="text-xs text-muted-foreground mt-0.5">By ticket volume this month</p>
          </div>
        </div>
        <Link
          href="/customers"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          All customers <ExternalLink size={11} />
        </Link>
      </div>

      {!customers.length ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No customers yet. Start helping users to see insights here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {customers.map((c, i) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-hover transition-colors group"
            >
              {/* Rank number */}
              <span className="text-xs font-bold text-muted-foreground w-4 shrink-0 tabular-nums">
                {i + 1}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {c.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">{c.email}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums">{c.ticketCount}</p>
                <p className="text-[10px] text-muted-foreground">tickets</p>
              </div>

              {/* Open indicator */}
              {c.openTickets > 0 && (
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                  c.openTickets >= 3
                    ? "bg-destructive-subtle text-destructive"
                    : "bg-warning-subtle text-warning-foreground"
                )}>
                  {c.openTickets} open
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
