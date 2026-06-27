"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateTicket } from "../actions";
import type { TicketStatus } from "@/types/database";

interface UpdateTicketStatusProps {
  ticketId: string;
  currentStatus: TicketStatus;
}

export function UpdateTicketStatus({ ticketId, currentStatus }: UpdateTicketStatusProps) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", ticketId);
      formData.set("status", newStatus);
      await updateTicket(formData);
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Update Status</CardTitle>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent>
        <Select defaultValue={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
