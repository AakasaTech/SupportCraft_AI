import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/helpers";
import { getTicketById, getAgents } from "@/features/tickets/lib/queries";
import { hasPermission } from "@/lib/permissions";
import { TicketHeader } from "@/components/tickets/detail/TicketHeader";
import { ConversationThread } from "@/components/tickets/conversation/ConversationThread";
import { TicketReplySection } from "@/components/tickets/detail/TicketReplySection";
import { TicketInfoPanel } from "@/components/tickets/detail/TicketInfoPanel";
import { CustomerInfoPanel } from "@/components/tickets/detail/CustomerInfoPanel";
import { ActivityPanel } from "@/components/tickets/detail/ActivityPanel";
import { AIAssistantPanel } from "@/components/tickets/ai/AIAssistantPanel";
import { AIAnalyzePanel }   from "@/components/ai/AIAnalyzePanel";
import type { Customer, Profile, TicketMessageWithAuthor } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { ticket } = await getTicketById(id);
    return { title: `${ticket.ticket_number ?? "Ticket"} — ${ticket.title}` };
  } catch {
    return { title: "Ticket" };
  }
}

export default async function TicketDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireAuth();

  let data;
  try {
    data = await getTicketById(id);
  } catch {
    notFound();
  }

  const { ticket, messages, attachments: _a } = data;
  const agents = await getAgents(profile.org_id);
  const canDelete = hasPermission(profile.role, "tickets:delete");

  const customer = ticket.customer as Customer | null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">

      {/* Sticky header */}
      <TicketHeader ticket={ticket} canDelete={canDelete} />

      {/* Main workspace */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: conversation + reply editor */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          <ConversationThread
            ticketId={ticket.id}
            initialMessages={messages as TicketMessageWithAuthor[]}
          />

          <TicketReplySection
            ticketId={ticket.id}
          />
        </div>

        {/* Right sidebar: panels */}
        <aside className="w-72 xl:w-80 border-l border-border overflow-y-auto shrink-0 bg-muted/20 space-y-3 p-3">

          <TicketInfoPanel
            ticket={ticket}
            agents={agents as Pick<Profile, "id" | "full_name" | "avatar_url">[]}
          />

          {customer && (
            <Suspense fallback={<div className="sc-card h-32 animate-pulse" />}>
              <CustomerInfoPanel customer={customer} currentTicketId={ticket.id} />
            </Suspense>
          )}

          <AIAssistantPanel
            ticketId={ticket.id}
            ticketTitle={ticket.title}
            ticketContent={ticket.description}
            orgId={profile.org_id}
          />

          <AIAnalyzePanel ticketId={ticket.id} />

          <Suspense fallback={<div className="sc-card h-24 animate-pulse" />}>
            <ActivityPanel ticketId={ticket.id} />
          </Suspense>

        </aside>
      </div>
    </div>
  );
}
