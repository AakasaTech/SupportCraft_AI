import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Ticket, CheckCircle2, Clock, Plus, BookOpen, ArrowRight, AlertCircle,
} from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const STATUS_LABEL: Record<string, string> = {
  new: "New", open: "Open", in_progress: "In Progress",
  pending: "Pending", resolved: "Resolved", closed: "Closed",
};

const STATUS_VARIANT: Record<string, string> = {
  new:         "bg-muted text-muted-foreground",
  open:        "bg-primary/10 text-primary",
  in_progress: "bg-primary/10 text-primary",
  pending:     "bg-warning-subtle text-warning-foreground",
  resolved:    "bg-success-subtle text-success",
  closed:      "bg-muted text-muted-foreground",
};

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  const firstName = customers[0]?.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "there";

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {firstName} 👋</h1>
          <p className="text-muted-foreground mt-1">
            Your support account is being set up. An agent will reach out to you shortly.
          </p>
        </div>
        <div className="sc-card p-8 text-center space-y-3">
          <AlertCircle size={32} className="text-muted-foreground mx-auto" />
          <p className="font-medium text-foreground">No account linked yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Your email hasn&apos;t been linked to a support account. If you believe this is an error,
            please contact support directly.
          </p>
        </div>
      </div>
    );
  }

  const customerIds = customers.map((c) => c.id);
  const admin       = createAdminClient();

  const { data: tickets } = await admin
    .from("tickets")
    .select("id, ticket_number, title, status, updated_at")
    .in("customer_id", customerIds)
    .order("updated_at", { ascending: false });

  const allTickets = tickets ?? [];

  const openCount     = allTickets.filter((t) => ["new", "open", "in_progress"].includes(t.status)).length;
  const pendingCount  = allTickets.filter((t) => t.status === "pending").length;
  const resolvedCount = allTickets.filter((t) => ["resolved", "closed"].includes(t.status)).length;
  const recentTickets = allTickets.slice(0, 5);

  // Recent KB articles from customer's orgs
  const orgIds = [...new Set(customers.map((c) => c.org_id))];
  const { data: articles } = await admin
    .from("knowledge_articles")
    .select("id, title, category")
    .in("org_id", orgIds)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(4);

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {firstName} 👋</h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s a summary of your support activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="sc-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Ticket size={16} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Open</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{openCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active tickets</p>
        </div>

        <div className="sc-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-warning-subtle">
              <Clock size={16} className="text-warning-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Pending</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Awaiting response</p>
        </div>

        <div className="sc-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success-subtle">
              <CheckCircle2 size={16} className="text-success" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">Resolved</span>
          </div>
          <p className="text-3xl font-bold text-foreground">{resolvedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Closed tickets</p>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Link
            href="/portal/tickets/new"
            className="sc-card p-4 flex items-center gap-3 hover:border-primary/40 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Plus size={16} className="text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">New Ticket</span>
          </Link>
          <Link
            href="/portal/tickets"
            className="sc-card p-4 flex items-center gap-3 hover:border-primary/40 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/70 transition-colors">
              <Ticket size={16} className="text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">My Tickets</span>
          </Link>
          <Link
            href="/portal/knowledge-base"
            className="sc-card p-4 flex items-center gap-3 hover:border-primary/40 transition-colors group"
          >
            <div className="p-2 rounded-lg bg-muted group-hover:bg-muted/70 transition-colors">
              <BookOpen size={16} className="text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Knowledge Base</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent tickets */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Tickets</h2>
            <Link href="/portal/tickets" className="text-xs text-primary hover:opacity-80 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {recentTickets.length === 0 ? (
            <div className="sc-card p-6 text-center">
              <Ticket size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No tickets yet.</p>
              <Link href="/portal/tickets/new" className="text-sm text-primary hover:opacity-80 mt-1 inline-block">
                Submit your first ticket →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/portal/tickets/${ticket.id}`}
                  className="sc-card p-3.5 flex items-center gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    {ticket.ticket_number && (
                      <p className="text-xs font-mono text-muted-foreground">{ticket.ticket_number}</p>
                    )}
                    <p className="text-sm font-medium text-foreground truncate">{ticket.title}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full shrink-0",
                    STATUS_VARIANT[ticket.status] ?? "bg-muted text-muted-foreground",
                  )}>
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* KB articles */}
        {articles && articles.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Help Articles</h2>
              <Link href="/portal/knowledge-base" className="text-xs text-primary hover:opacity-80 flex items-center gap-1">
                Browse all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/portal/knowledge-base/${article.id}`}
                  className="sc-card p-3.5 flex items-center gap-3 hover:border-primary/40 transition-colors group"
                >
                  <div className="p-1.5 rounded-lg bg-muted shrink-0">
                    <BookOpen size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{article.title}</p>
                    {article.category && (
                      <p className="text-xs text-muted-foreground">{article.category}</p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
