"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { MessageBubble, SystemEvent } from "./MessageBubble";
import type { TicketMessageWithAuthor } from "@/types/database";

interface Props {
  ticketId:        string;
  initialMessages: TicketMessageWithAuthor[];
}

export function ConversationThread({ ticketId, initialMessages }: Props) {
  const [messages, setMessages] = useState<TicketMessageWithAuthor[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirst   = useRef(true);

  // Merge server-refreshed messages (from router.refresh()) into local state.
  // Keeps any realtime-received messages that aren't in the server set yet.
  useEffect(() => {
    setMessages((prev) => {
      const serverIds   = new Set(initialMessages.map((m) => m.id));
      const realtimeOnly = prev.filter((m) => !serverIds.has(m.id));
      if (realtimeOnly.length === 0 && prev.length === initialMessages.length) return prev;
      return [...initialMessages, ...realtimeOnly].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });
  }, [initialMessages]);

  // Scroll to bottom on new messages
  const scrollBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (isFirst.current) {
      scrollBottom(false);
      isFirst.current = false;
    }
  }, [scrollBottom]);

  useEffect(() => {
    if (!isFirst.current) scrollBottom(true);
  }, [messages.length, scrollBottom]);

  // Supabase Realtime: receives other agents' replies in real time.
  // The raw payload has no author join, so we store a placeholder and let
  // the next router.refresh() fill in the full author data.
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const channel = supabase
      .channel(`ticket:${ticketId}:messages`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "ticket_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const newMsg = { ...raw, author: null } as unknown as TicketMessageWithAuthor;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  if (!messages.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-muted-foreground p-8">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">💬</div>
        <p className="text-sm font-medium">No messages yet</p>
        <p className="text-xs">Send the first reply below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {messages.map((msg, i) => {
          // System events (metadata.type === 'system') show as horizontal rule
          const meta = msg.metadata as { type?: string } | null;
          if (meta?.type === "system") {
            return <SystemEvent key={msg.id} message={msg} />;
          }
          return <MessageBubble key={msg.id} message={msg} isFirst={i === 0} />;
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
