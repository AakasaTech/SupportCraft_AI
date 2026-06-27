"use client";

import { useState, useTransition } from "react";
import { Tag, Calendar, Globe, User, ChevronDown, Check, Clock } from "lucide-react";
import { StatusBadge } from "@/components/tickets/shared/StatusBadge";
import { PriorityBadge } from "@/components/tickets/shared/PriorityBadge";
import { computeSLA, getSLABgColor } from "@/lib/sla";
import { updateTicketField } from "@/features/tickets/actions";
import { cn } from "@/lib/utils";
import type { Ticket, Profile, TicketStatus, TicketPriority } from "@/types/database";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const SOURCE_LABELS: Record<string, string> = {
  email: "Email", portal: "Customer Portal", chat: "Live Chat",
  api: "API", phone: "Phone", manual: "Manual",
};

interface Props {
  ticket:  Ticket;
  agents:  Pick<Profile, "id" | "full_name" | "avatar_url">[];
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 pt-0.5 min-w-[80px]">{label}</span>
      <div className="text-xs text-right">{children}</div>
    </div>
  );
}

export function TicketInfoPanel({ ticket, agents }: Props) {
  const [status,     setStatus]     = useState<TicketStatus>(ticket.status);
  const [priority,   setPriority]   = useState<TicketPriority>(ticket.priority);
  const [assigneeId, setAssigneeId] = useState<string>(ticket.assignee_id ?? "__none__");
  const [, startTransition]         = useTransition();

  const sla = computeSLA(ticket.created_at, ticket.priority, ticket.first_response_at, ticket.resolved_at);

  const update = (field: string, value: unknown) =>
    startTransition(() => { void updateTicketField(ticket.id, field, value); });

  const tagsArr = ticket.tags ?? [];

  return (
    <div className="sc-card">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ticket Info</h3>
      </div>

      <div className="px-4 py-1">
        <Row label="Status">
          <Select value={status} onValueChange={(v) => { setStatus(v as TicketStatus); update("status", v); }}>
            <SelectTrigger className="h-auto border-0 p-0 shadow-none w-auto gap-1 focus:ring-0 text-xs">
              <StatusBadge status={status} size="sm" />
            </SelectTrigger>
            <SelectContent>
              {(["new","open","in_progress","pending","resolved","closed"] as TicketStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row label="Priority">
          <Select value={priority} onValueChange={(v) => { setPriority(v as TicketPriority); update("priority", v); }}>
            <SelectTrigger className="h-auto border-0 p-0 shadow-none w-auto gap-1 focus:ring-0 text-xs">
              <PriorityBadge priority={priority} size="sm" />
            </SelectTrigger>
            <SelectContent>
              {(["urgent","high","medium","low"] as TicketPriority[]).map((p) => (
                <SelectItem key={p} value={p} className="text-xs capitalize">{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <Row label="Assignee">
          <Select
            value={assigneeId}
            onValueChange={(v) => {
              setAssigneeId(v);
              update("assignee_id", v === "__none__" ? null : v);
            }}
          >
            <SelectTrigger className="h-6 border-0 p-0 shadow-none focus:ring-0 text-xs w-[130px] justify-end">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs">Unassigned</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id} className="text-xs">{a.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        {ticket.department && <Row label="Department"><span className="font-medium">{ticket.department}</span></Row>}
        {ticket.category   && <Row label="Category"><span className="font-medium">{ticket.category}</span></Row>}

        <Row label="Source">
          <span className="flex items-center gap-1">
            <Globe size={11} />
            {SOURCE_LABELS[ticket.source] ?? ticket.source}
          </span>
        </Row>

        <Row label="SLA">
          <div className="space-y-1 text-right">
            <div className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block", getSLABgColor(sla.firstResponseStatus))}>
              1st: {sla.firstResponseLabel}
            </div>
            <div className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full inline-block", getSLABgColor(sla.resolutionStatus))}>
              Res: {sla.resolutionLabel}
            </div>
          </div>
        </Row>

        <Row label="Created">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar size={11} />
            {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </Row>

        {ticket.due_date && (
          <Row label="Due">
            <span className={cn(
              "flex items-center gap-1",
              new Date(ticket.due_date) < new Date() ? "text-destructive" : "text-muted-foreground"
            )}>
              <Clock size={11} />
              {new Date(ticket.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </Row>
        )}

        {tagsArr.length > 0 && (
          <Row label="Tags">
            <div className="flex flex-wrap gap-1 justify-end">
              {tagsArr.map((tag) => (
                <span key={tag} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Tag size={9} />{tag}
                </span>
              ))}
            </div>
          </Row>
        )}
      </div>
    </div>
  );
}
