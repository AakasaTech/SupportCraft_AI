"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, Lock, Sparkles, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { replyToTicket } from "@/features/tickets/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  ticketId: string;
  onReplySent?: () => void;
  aiSuggestion?: string;
  onRequestAI?: () => void;
  isAILoading?: boolean;
}

export function ReplyEditor({
  ticketId,
  onReplySent,
  aiSuggestion,
  onRequestAI,
  isAILoading,
}: Props) {
  const router = useRouter();
  const [mode, setMode]         = useState<"reply" | "note">("reply");
  const [content, setContent]   = useState("");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInternal = mode === "note";
  const charCount  = content.length;
  const canSend    = content.trim().length > 0 && !isPending;

  // Apply AI suggestion
  const applyAiSuggestion = () => {
    if (aiSuggestion) {
      setContent(aiSuggestion);
      textareaRef.current?.focus();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 320) + "px";
  };

  // Cmd+Enter to send
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (canSend) handleSend();
    }
  };

  const handleSend = () => {
    if (!canSend) return;
    const fd = new FormData();
    fd.set("ticketId",   ticketId);
    fd.set("content",    content.trim());
    fd.set("isInternal", String(isInternal));

    startTransition(async () => {
      const result = await replyToTicket(fd);
      if (!result?.error) {
        setContent("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        router.refresh();
        onReplySent?.();
      }
    });
  };

  return (
    <div className={cn(
      "border-t border-border bg-background",
      isInternal ? "bg-amber-50/50" : ""
    )}>
      {/* AI suggestion banner */}
      {aiSuggestion && (
        <div className="px-4 pt-3">
          <div className="flex items-start gap-2 p-3 rounded-xl bg-ai-subtle border border-ai/20 text-sm">
            <Sparkles size={14} className="text-ai shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-ai mb-1">AI Suggestion Ready</p>
              <p className="text-muted-foreground text-xs line-clamp-2">{aiSuggestion}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={applyAiSuggestion}>
                Use
              </Button>
              <button className="p-1 rounded hover:bg-muted" onClick={() => {}}>
                <X size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-2">
        <button
          onClick={() => setMode("reply")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            mode === "reply"
              ? "bg-primary text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          Public Reply
        </button>
        <button
          onClick={() => setMode("note")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1",
            mode === "note"
              ? "bg-amber-500 text-white"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Lock size={11} />
          Internal Note
        </button>
      </div>

      {/* Textarea */}
      <div className="px-4 pb-2">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isInternal
              ? "Write an internal note (never visible to the customer)…"
              : "Write a reply to the customer…"
          }
          className={cn(
            "min-h-[100px] max-h-80 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed",
            isInternal ? "placeholder:text-amber-400" : ""
          )}
        />
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between px-4 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Attach file (coming soon)"
            disabled
          >
            <Paperclip size={15} />
          </button>
          <button
            type="button"
            onClick={onRequestAI}
            disabled={isAILoading}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              "text-ai bg-ai-subtle hover:bg-ai/20"
            )}
          >
            {isAILoading
              ? <Loader2 size={12} className="animate-spin" />
              : <Sparkles size={12} />}
            AI Generate
          </button>
          <span className="text-[11px] text-muted-foreground ml-1">
            {charCount > 0 ? `${charCount.toLocaleString()} chars` : "⌘↵ to send"}
          </span>
        </div>

        <Button
          size="sm"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            isInternal ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
          )}
        >
          {isPending ? (
            <><Loader2 size={13} className="animate-spin mr-1.5" />Sending…</>
          ) : (
            <><Send size={13} className="mr-1.5" />{isInternal ? "Add Note" : "Send Reply"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
