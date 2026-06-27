"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { replyToTicket } from "../actions";
import { formatRelativeTime } from "@/lib/utils";
import type { TicketMessageWithAuthor } from "../types";

interface TicketThreadProps {
  ticketId: string;
  messages: TicketMessageWithAuthor[];
}

export function TicketThread({ ticketId, messages: initialMessages }: TicketThreadProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuggestLoading, setIsSuggestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleReply() {
    if (!content.trim()) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("ticketId", ticketId);
      formData.set("content", content);
      const result = await replyToTicket(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setContent("");
      }
    });
  }

  async function handleAISuggest() {
    setIsSuggestLoading(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (data.suggestion) {
        setContent(data.suggestion);
      }
    } catch {
      setError("Failed to get AI suggestion");
    } finally {
      setIsSuggestLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.is_customer ? "" : "flex-row-reverse"}`}>
            <Avatar className="h-8 w-8 shrink-0">
              {msg.is_ai ? (
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              ) : (
                <>
                  <AvatarImage src={msg.author?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {msg.is_customer
                      ? "C"
                      : msg.author?.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2) ?? "?"}
                  </AvatarFallback>
                </>
              )}
            </Avatar>
            <div className={`max-w-[70%] ${msg.is_customer ? "" : "items-end"} flex flex-col gap-1`}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">
                  {msg.is_customer ? "Customer" : msg.is_ai ? "AI Suggestion" : (msg.author?.full_name ?? "Agent")}
                </span>
                {msg.is_ai && <Badge variant="secondary" className="text-xs py-0">AI</Badge>}
                <span className="text-xs text-muted-foreground">{formatRelativeTime(msg.created_at)}</span>
              </div>
              <div
                className={`rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.is_customer
                    ? "bg-muted text-foreground"
                    : msg.is_ai
                    ? "bg-primary/5 border border-primary/20 text-foreground"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-4 space-y-3">
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Textarea
          placeholder="Write a reply…"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
          }}
        />
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAISuggest}
            disabled={isSuggestLoading}
          >
            {isSuggestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            AI Suggest
          </Button>
          <Button onClick={handleReply} disabled={isPending || !content.trim()} size="sm">
            {isPending ? <Loader2 className="animate-spin" /> : <Send />}
            Send reply
          </Button>
        </div>
      </div>
    </div>
  );
}
