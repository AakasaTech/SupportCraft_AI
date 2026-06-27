"use client";

import { useTransition } from "react";
import { CheckCircle, XCircle, Trash2, UserCheck, AlertTriangle, Loader2, X } from "lucide-react";
import { bulkUpdateTickets } from "@/features/tickets/actions";

interface Props {
  selectedIds: string[];
  onClear:     () => void;
}

export function BulkActions({ selectedIds, onClear }: Props) {
  const [isPending, startTransition] = useTransition();
  const count = selectedIds.length;

  const run = (action: string, extra?: Record<string, string>) => {
    if (!count) return;
    const fd = new FormData();
    fd.set("ticketIds", selectedIds.join(","));
    fd.set("action", action);
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.set(k, v));
    startTransition(async () => {
      await bulkUpdateTickets(fd);
      onClear();
    });
  };

  const handleDelete = () => {
    if (!confirm(`Delete ${count} ticket${count > 1 ? "s" : ""}? This cannot be undone.`)) return;
    run("delete");
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-foreground text-background shadow-2xl border border-border/20">
      <span className="text-xs font-semibold mr-1">{count} selected</span>

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={() => run("resolve")}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-background/10 transition-colors text-emerald-400"
      >
        <CheckCircle size={13} />Resolve
      </button>

      <button
        onClick={() => run("close")}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-background/10 transition-colors text-muted-foreground text-slate-400"
      >
        <XCircle size={13} />Close
      </button>

      <button
        onClick={() => run("setPriority", { priority: "urgent" })}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-background/10 transition-colors text-red-400"
      >
        <AlertTriangle size={13} />Urgent
      </button>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-background/10 transition-colors text-red-400"
      >
        {isPending
          ? <Loader2 size={13} className="animate-spin" />
          : <Trash2 size={13} />}
        Delete
      </button>

      <div className="w-px h-5 bg-background/20" />

      <button
        onClick={onClear}
        className="p-1.5 rounded-lg hover:bg-background/10 transition-colors"
        title="Clear selection"
      >
        <X size={14} />
      </button>
    </div>
  );
}
