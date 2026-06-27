import Link from "next/link";
import { Mail, Phone, Building2, ExternalLink, Clock, TicketCheck } from "lucide-react";
import { StatusBadge } from "@/components/tickets/shared/StatusBadge";
import { getCustomerTickets } from "@/features/tickets/lib/queries";
import type { Customer } from "@/types/database";

interface Props {
  customer:        Customer;
  currentTicketId: string;
}

export async function CustomerInfoPanel({ customer, currentTicketId }: Props) {
  const previousTickets = await getCustomerTickets(customer.id, currentTicketId);

  return (
    <div className="sc-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-subtle flex items-center justify-center text-sm font-bold text-primary shrink-0">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <Link
              href={`/customers/${customer.id}`}
              className="text-sm font-semibold hover:text-primary hover:underline flex items-center gap-1 truncate"
            >
              {customer.name}
              <ExternalLink size={11} className="shrink-0" />
            </Link>
            {customer.company && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                <Building2 size={10} />
                {customer.company}
              </p>
            )}
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-2">
          <a
            href={`mailto:${customer.email}`}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors group"
          >
            <Mail size={12} className="shrink-0" />
            <span className="truncate group-hover:underline">{customer.email}</span>
          </a>
          {customer.phone && (
            <a
              href={`tel:${customer.phone}`}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone size={12} className="shrink-0" />
              {customer.phone}
            </a>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock size={12} className="shrink-0" />
            Customer since {new Date(customer.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </div>
        </div>

        {/* Previous tickets */}
        {previousTickets.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <TicketCheck size={11} />
              Previous tickets ({previousTickets.length})
            </p>
            <div className="space-y-1.5">
              {previousTickets.map((t) => (
                <Link
                  key={t.id}
                  href={`/tickets/${t.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-hover transition-colors group"
                >
                  {t.ticket_number && (
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">{t.ticket_number}</span>
                  )}
                  <span className="text-xs truncate flex-1 group-hover:text-primary">{t.title}</span>
                  <StatusBadge status={t.status} size="sm" showDot={false} />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
