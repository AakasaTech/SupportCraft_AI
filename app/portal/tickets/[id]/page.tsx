import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Bot, User } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { PortalReplyForm } from "./PortalReplyForm";
import { CSATRating } from "./CSATRating";
import { cn } from "@/lib/utils";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Ticket" };
}

export default async function PortalTicketDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) redirect("/portal/tickets");

  const customerIds = customers.map((c) => c.id);
  const admin       = createAdminClient();

  const { data: ticket } = await admin
    .from("tickets")
    .select("id, ticket_number, title, status, priority, description, created_at, customer_id")
    .eq("id", id)
    .in("customer_id", customerIds)
    .single();

  if (!ticket) notFound();

  const [{ data: messages }, { data: existingRating }] = await Promise.all([
    admin
      .from("ticket_messages")
      .select("id, content, is_ai, is_customer, created_at")
      .eq("ticket_id", id)
      .eq("is_internal", false)
      .order("created_at"),
    admin
      .from("ticket_ratings")
      .select("id, rating, comment")
      .eq("ticket_id", id)
      .maybeSingle(),
  ]);

  const canReply  = !["resolved", "closed"].includes(ticket.status);
  const isResolved = ["resolved", "closed"].includes(ticket.status);
  const showCSAT   = isResolved && !existingRating;

  const descriptionBubble = {
    id:          `desc-${ticket.id}`,
    content:     ticket.description,
    is_ai:       false,
    is_customer: true,
    created_at:  ticket.created_at,
  };

  const allMessages = [descriptionBubble, ...(messages ?? [])];

  const STATUS_LABEL: Record<string, string> = {
    new: "New", open: "Open", in_progress: "In Progress",
    pending: "Pending", resolved: "Resolved", closed: "Closed",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link
          href="/portal/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          All tickets
        </Link>
        {ticket.ticket_number && (
          <p className="text-xs text-muted-foreground font-mono mb-1">{ticket.ticket_number}</p>
        )}
        <h1 className="text-xl font-bold text-foreground">{ticket.title}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Opened {new Date(ticket.created_at).toLocaleDateString()} &bull; Status:{" "}
          <span className="font-medium text-foreground">
            {STATUS_LABEL[ticket.status] ?? ticket.status}
          </span>
        </p>
      </div>

      {/* Conversation thread */}
      <div className="sc-card p-4 space-y-3">
        {allMessages.map((msg, i) => (
          <div
            key={msg.id}
            className={cn("flex gap-3", msg.is_customer ? "flex-row-reverse" : "flex-row")}
          >
            <div className="p-1.5 rounded-full bg-muted shrink-0 self-start mt-0.5">
              {msg.is_ai
                ? <Bot  size={14} className="text-primary" />
                : <User size={14} className="text-muted-foreground" />}
            </div>
            <div className={cn(
              "max-w-[80%] rounded-xl px-3 py-2.5 text-sm",
              msg.is_customer ? "bg-primary ml-auto" : "bg-muted",
              i === 0 && "rounded-tl-sm",
            )}>
              {i === 0 && (
                <p className={cn(
                  "text-xs font-semibold mb-1.5 opacity-70",
                  msg.is_customer ? "text-white" : "text-foreground",
                )}>
                  Your request
                </p>
              )}
              <p className={cn(
                "whitespace-pre-wrap leading-relaxed",
                msg.is_customer ? "text-white" : "text-foreground",
              )}>
                {msg.content}
              </p>
              <p className={cn(
                "text-xs mt-1.5",
                msg.is_customer ? "text-white opacity-70" : "text-muted-foreground",
              )}>
                {new Date(msg.created_at).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply form or resolved message */}
      {canReply ? (
        <PortalReplyForm ticketId={ticket.id} />
      ) : (
        <div className="sc-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            This ticket is {STATUS_LABEL[ticket.status]?.toLowerCase() ?? ticket.status}.{" "}
            <Link href="/portal/tickets/new" className="text-primary hover:opacity-80">
              Open a new ticket
            </Link>{" "}
            if you need further help.
          </p>
        </div>
      )}

      {/* CSAT rating */}
      {showCSAT && (
        <CSATRating ticketId={ticket.id} customerId={ticket.customer_id} />
      )}

      {/* Existing rating display */}
      {existingRating && (
        <div className="sc-card p-4 flex items-center gap-3">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={s <= existingRating.rating ? "text-amber-400" : "text-muted-foreground/30"}>★</span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            You rated this ticket {existingRating.rating}/5.
            {existingRating.comment && <span className="italic ml-1">&ldquo;{existingRating.comment}&rdquo;</span>}
          </p>
        </div>
      )}
    </div>
  );
}
