import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { TicketIcon, Plus } from "lucide-react";
import { getAuthUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { EmptyState } from "@/components/feedback/EmptyState";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My Tickets" };

const STATUS_LABEL: Record<string, string> = {
  new:         "New",
  open:        "Open",
  in_progress: "In Progress",
  pending:     "Pending",
  resolved:    "Resolved",
  closed:      "Closed",
};

const STATUS_VARIANT: Record<string, string> = {
  new:         "bg-muted text-muted-foreground",
  open:        "bg-primary-subtle text-primary",
  in_progress: "bg-primary-subtle text-primary",
  pending:     "bg-warning-subtle text-warning-foreground",
  resolved:    "bg-success-subtle text-success",
  closed:      "bg-muted text-muted-foreground",
};

export default async function PortalTicketsPage() {
  const user = await getAuthUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");

  if (customers.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold">My Tickets</h1>
        <EmptyState
          icon={TicketIcon}
          title="No tickets yet"
          description="Your support history will appear here once an agent creates a ticket for you."
        />
      </div>
    );
  }

  const customerIds = customers.map((c) => c.id);
  // Map customer_id → org_name for grouping
  const customerOrgMap = new Map(customers.map((c) => [c.id, c.org_name]));
  const primaryEmail   = customers[0].email;

  const ticketRows = await prisma.ticket.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true, ticketNumber: true, title: true, status: true, priority: true, createdAt: true, updatedAt: true, customerId: true },
    orderBy: { updatedAt: "desc" },
  });
  const tickets = ticketRows.map((t) => ({
    id: t.id, ticket_number: t.ticketNumber, title: t.title, status: t.status, priority: t.priority,
    created_at: t.createdAt, updated_at: t.updatedAt, customer_id: t.customerId!,
  }));

  if (!tickets?.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">My Tickets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{primaryEmail}</p>
          </div>
          <Link
            href="/portal/tickets/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus size={14} />
            New Ticket
          </Link>
        </div>
        <EmptyState icon={TicketIcon} title="No tickets yet" description="Submit a ticket and our team will get back to you shortly." />
      </div>
    );
  }

  // Group by organisation
  const grouped = new Map<string, typeof tickets>();
  for (const ticket of tickets) {
    const orgName = customerOrgMap.get(ticket.customer_id) ?? "Support";
    if (!grouped.has(orgName)) grouped.set(orgName, []);
    grouped.get(orgName)!.push(ticket);
  }

  const showOrgHeaders = grouped.size > 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">My Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{primaryEmail}</p>
        </div>
        <Link
          href="/portal/tickets/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus size={14} />
          New Ticket
        </Link>
      </div>

      {Array.from(grouped.entries()).map(([orgName, orgTickets]) => (
        <div key={orgName} className="space-y-2">
          {showOrgHeaders && (
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {orgName}
            </h2>
          )}
          {orgTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/portal/tickets/${ticket.id}`}
              className="sc-card p-4 flex items-start gap-4 hover:border-primary/40 transition-colors block"
            >
              <div className="flex-1 min-w-0">
                {ticket.ticket_number && (
                  <p className="text-xs text-muted-foreground font-mono mb-0.5">{ticket.ticket_number}</p>
                )}
                <p className="font-medium text-sm truncate">{ticket.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Updated {new Date(ticket.updated_at).toLocaleDateString()}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                  STATUS_VARIANT[ticket.status] ?? "bg-muted text-muted-foreground"
                )}
              >
                {STATUS_LABEL[ticket.status] ?? ticket.status}
              </span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
