import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { getTickets, getAgents, getDepartments, getTicketStats } from "@/features/tickets/lib/queries";
import { TicketTable } from "@/components/tickets/list/TicketTable";
import { TicketFilters } from "@/components/tickets/list/TicketFilters";
import type { TicketStatus, TicketPriority } from "@/lib/generated/prisma/client";

export const metadata: Metadata = { title: "Tickets — SupportCraft AI" };
export const dynamic = "force-dynamic";

interface SearchParams {
  status?:     string;
  priority?:   string;
  search?:     string;
  assignee?:   string;
  department?: string;
  sort?:       string;
  order?:      string;
  page?:       string;
  unassigned?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function TicketsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { profile } = await requireAuth();
  const orgId = profile.organizationId;

  const [{ tickets, total, page, pages }, agents, departments, stats] = await Promise.all([
    getTickets(orgId, {
      status:     (sp.status as TicketStatus) || undefined,
      priority:   (sp.priority as TicketPriority) || undefined,
      search:     sp.search || undefined,
      assigneeId: sp.assignee && sp.assignee !== "unassigned" ? sp.assignee : undefined,
      department: sp.department || undefined,
      unassigned: sp.assignee === "unassigned" ? true : undefined,
      sort:       (sp.sort as "created_at" | "updated_at" | "priority" | "status" | "ticket_number") || "updated_at",
      order:      (sp.order as "asc" | "desc") || "desc",
      page:       sp.page ? parseInt(sp.page) : 1,
    }),
    getAgents(orgId),
    getDepartments(orgId),
    getTicketStats(orgId),
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4 max-w-screen-2xl mx-auto">
          <div>
            <h1 className="text-xl font-bold">Tickets</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.total.toLocaleString()} total ·{" "}
              {stats.open.toLocaleString()} open ·{" "}
              {stats.pending.toLocaleString()} waiting
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/tickets/new"
              className="sc-btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
            >
              <Plus size={15} />
              New Ticket
            </Link>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 max-w-screen-2xl mx-auto space-y-4">
        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <form className="relative flex-1 min-w-[200px] max-w-md" action="/tickets" method="GET">
            {/* Preserve existing params */}
            {sp.status     && <input type="hidden" name="status"     value={sp.status} />}
            {sp.priority   && <input type="hidden" name="priority"   value={sp.priority} />}
            {sp.assignee   && <input type="hidden" name="assignee"   value={sp.assignee} />}
            {sp.department && <input type="hidden" name="department" value={sp.department} />}
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="search"
              defaultValue={sp.search}
              placeholder="Search tickets…"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </form>

          <TicketFilters agents={agents} departments={departments} />
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[
            { label: "New",       count: stats.new,         status: "new"         },
            { label: "Open",      count: stats.open,        status: "open"        },
            { label: "Progress",  count: stats.in_progress, status: "in_progress" },
            { label: "Waiting",   count: stats.pending,     status: "pending"     },
            { label: "Resolved",  count: stats.resolved,    status: "resolved"    },
            { label: "Closed",    count: stats.closed,      status: "closed"      },
          ].map((s) => (
            <Link
              key={s.status}
              href={`/tickets?status=${s.status}`}
              className="sc-card p-3 text-center hover:border-primary/40 transition-colors group"
            >
              <p className="text-xl font-bold group-hover:text-primary transition-colors">{s.count}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* Table */}
        <TicketTable
          tickets={tickets}
          total={total}
          page={page}
          pages={pages}
        />
      </div>
    </div>
  );
}
