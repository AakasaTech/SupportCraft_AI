"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble, SystemEvent, type TicketMessageWithAuthor } from "./MessageBubble";

interface Props {
  ticketId:        string;
  initialMessages: TicketMessageWithAuthor[];
}

export function ConversationThread({ ticketId: _ticketId, initialMessages }: Props) {
  const [messages, setMessages] = useState<TicketMessageWithAuthor[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirst   = useRef(true);

  // New messages arrive via router.refresh() (e.g. after posting a reply) —
  // there is no live push; see project notes on the Supabase Realtime removal.
  useEffect(() => {
    setMessages(initialMessages);
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
