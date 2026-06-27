"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { portalReplyToTicket } from "@/features/tickets/actions/portalActions";

export function PortalReplyForm({ ticketId }: { ticketId: string }) {
  const router  = useRouter();
  const [content, setContent]   = useState("");
  const [error,   setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = content.trim().length > 0 && !isPending;

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 240) + "px";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setError(null);
    const fd = new FormData();
    fd.set("ticketId", ticketId);
    fd.set("content",  content.trim());

    startTransition(async () => {
      const result = await portalReplyToTicket(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setContent("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        router.refresh();
      }
    });
  };

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Add a reply
        </p>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (canSend) handleSubmit(e as unknown as React.FormEvent); } }}
          placeholder="Write your reply…"
          rows={3}
          className="w-full resize-none text-sm bg-muted/40 border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">⌘↵ to send</p>
          <button
            type="submit"
            disabled={!canSend}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isPending
              ? <><Loader2 size={13} className="animate-spin" />Sending…</>
              : <><Send size={13} />Send Reply</>}
          </button>
        </div>
      </form>
    </div>
  );
}
