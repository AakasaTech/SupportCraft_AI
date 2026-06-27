import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const { data } = await supabase.from("customers").select("name").eq("id", id).single();
  return { title: data?.name ?? "Customer" };
}

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) notFound();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, title, status, priority, created_at")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

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
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(ticket.created_at)}</p>
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
