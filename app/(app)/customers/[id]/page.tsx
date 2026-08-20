import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/shared/Header";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketStatusBadge, TicketPriorityBadge } from "@/features/tickets/components/TicketStatusBadge";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  return { title: customer?.name ?? "Customer" };
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();

  // Scoped to this agent's org — Prisma has no RLS, so this check is what
  // stops one org's agent from viewing another org's customer by URL id.
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: user.profile.organizationId },
  });

  if (!customer) notFound();

  const tickets = await prisma.ticket.findMany({
    where:   { customerId: id },
    select:  { id: true, title: true, status: true, priority: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take:    20,
  });

  return (
    <div>
      <Header title={customer.name} description={customer.email} />
      <div className="p-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerForm customer={customer} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ticket History ({tickets?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!tickets?.length ? (
              <p className="text-sm text-muted-foreground">No tickets yet</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ticket.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(ticket.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <TicketPriorityBadge priority={ticket.priority} />
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
