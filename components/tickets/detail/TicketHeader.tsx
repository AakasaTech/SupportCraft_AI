"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft, MoreHorizontal, Trash2, GitMerge,
  UserPlus, CheckCircle, XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/tickets/shared/StatusBadge";
import { PriorityBadge } from "@/components/tickets/shared/PriorityBadge";
import { computeSLA, getSLABgColor } from "@/lib/sla";
import { updateTicketField, deleteTicket } from "@/features/tickets/actions";
import { cn } from "@/lib/utils";
import type { Ticket, TicketStatus, TicketPriority } from "@/types/database";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "new",         label: "New" },
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending",     label: "Waiting" },
  { value: "resolved",    label: "Resolved" },
  { value: "closed",      label: "Closed" },
];

const PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high",   label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low" },
];

interface Props {
  ticket:   Ticket;
  canDelete: boolean;
}

export function TicketHeader({ ticket, canDelete }: Props) {
  const [status,   setStatus]   = useState<TicketStatus>(ticket.status);
  const [priority, setPriority] = useState<TicketPriority>(ticket.priority);
  const [, startTransition] = useTransition();

  const sla = computeSLA(ticket.created_at, ticket.priority, ticket.first_response_at, ticket.resolved_at);

  const handleStatusChange = (newStatus: TicketStatus) => {
    setStatus(newStatus);
    startTransition(() => { void updateTicketField(ticket.id, "status", newStatus); });
  };

  const handlePriorityChange = (newPriority: TicketPriority) => {
    setPriority(newPriority);
    startTransition(() => { void updateTicketField(ticket.id, "priority", newPriority); });
  };

  const handleDelete = () => {
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    startTransition(() => { void deleteTicket(ticket.id); });
  };

  const handleClose = () => handleStatusChange("closed");
  const handleResolve = () => handleStatusChange("resolved");

  return (
    <div className="border-b border-border bg-background px-4 py-3">
      {/* Back + ticket number */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/tickets" className="p-1 rounded hover:bg-muted transition-colors">
          <ChevronLeft size={16} className="text-muted-foreground" />
        </Link>
        {ticket.ticket_number && (
          <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {ticket.ticket_number}
          </span>
        )}
        <div className="flex-1" />
        {/* SLA indicator */}
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", getSLABgColor(sla.resolutionStatus))}>
          {sla.resolutionLabel}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-base font-semibold leading-snug mb-3 line-clamp-2">{ticket.title}</h1>

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Status selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <StatusBadge status={status} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {STATUSES.map((s) => (
              <DropdownMenuItem
                key={s.value}
                onSelect={() => handleStatusChange(s.value)}
                className={status === s.value ? "bg-primary-subtle" : ""}
              >
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Priority selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="focus:outline-none">
              <PriorityBadge priority={priority} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-36">
            {PRIORITIES.map((p) => (
              <DropdownMenuItem
                key={p.value}
                onSelect={() => handlePriorityChange(p.value)}
                className={priority === p.value ? "bg-primary-subtle" : ""}
              >
                {p.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {ticket.department && (
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
            {ticket.department}
          </span>
        )}

        <div className="flex-1" />

        {/* Quick action buttons */}
        <button
          onClick={handleResolve}
          disabled={status === "resolved" || status === "closed"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-success-subtle text-success hover:bg-success/20 disabled:opacity-40 transition-colors"
        >
          <CheckCircle size={12} />
          Resolve
        </button>

        <button
          onClick={handleClose}
          disabled={status === "closed"}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-muted text-muted-foreground hover:bg-border transition-colors disabled:opacity-40"
        >
          <XCircle size={12} />
          Close
        </button>

        {/* More menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem className="gap-2">
              <UserPlus size={13} />Assign Agent
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <GitMerge size={13} />Merge Ticket
            </DropdownMenuItem>
            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleDelete}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 size={13} />Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
