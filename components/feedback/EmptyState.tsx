import {
  Ticket,
  Users,
  BookOpen,
  Bell,
  UserCheck,
  SearchX,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-2xl bg-muted">
          <Icon size={28} className="text-muted-foreground" aria-hidden />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

/* ── Pre-built variants ──────────────────────────────── */

export function EmptyTickets({ onCreateTicket }: { onCreateTicket?: () => void }) {
  return (
    <EmptyState
      icon={Ticket}
      title="No tickets yet"
      description="When customers reach out, their support tickets will appear here. Create your first ticket to get started."
      primaryAction={
        onCreateTicket ? (
          <button
            onClick={onCreateTicket}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Create ticket
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptyCustomers({ onAddCustomer }: { onAddCustomer?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Add your first customer to start tracking their support history and profile."
      primaryAction={
        onAddCustomer ? (
          <button
            onClick={onAddCustomer}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Add customer
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptyKnowledgeBase({ onCreateArticle }: { onCreateArticle?: () => void }) {
  return (
    <EmptyState
      icon={BookOpen}
      title="No articles yet"
      description="Build your knowledge base to help customers find answers and power AI reply suggestions."
      primaryAction={
        onCreateArticle ? (
          <button
            onClick={onCreateArticle}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Write first article
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="All caught up"
      description="You have no new notifications. Check back later."
    />
  );
}

export function EmptyTeam({ onInvite }: { onInvite?: () => void }) {
  return (
    <EmptyState
      icon={UserCheck}
      title="No team members yet"
      description="Invite your team to collaborate on tickets and manage customer support together."
      primaryAction={
        onInvite ? (
          <button
            onClick={onInvite}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            Invite member
          </button>
        ) : undefined
      }
    />
  );
}

export function EmptySearchResults({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description={
        query
          ? `No results for "${query}". Try different keywords or clear your search.`
          : "Try adjusting your search or filters to find what you are looking for."
      }
    />
  );
}
