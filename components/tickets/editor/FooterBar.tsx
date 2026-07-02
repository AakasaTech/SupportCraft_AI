"use client";

import { Send, Loader2, Sparkles, AtSign, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Editor } from "@tiptap/react";
import type { EditorMode } from "./types";
import { CannedPopover } from "./CannedPopover";
import { MentionPopover } from "./MentionPopover";

interface Props {
  editor:          Editor | null;
  mode:            EditorMode;
  isEmpty:         boolean;
  isSubmitting:    boolean;
  onSubmit:        () => void;
  onTriggerImage:  () => void;
  onTriggerFile:   () => void;
  onRequestAI?:    () => void;
  isAILoading?:    boolean;
}

export function FooterBar({
  editor,
  mode,
  isEmpty,
  isSubmitting,
  onSubmit,
  onRequestAI,
  isAILoading,
}: Props) {
  const canSend = !isEmpty && !isSubmitting;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-1">
        {/* @Mention */}
        <MentionPopover
          editor={editor}
          trigger={
            <button
              type="button"
              title="Mention agent"
              aria-label="Mention agent"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <AtSign size={14} />
            </button>
          }
        />

        {/* Canned responses */}
        <CannedPopover
          editor={editor}
          trigger={
            <button
              type="button"
              title="Insert canned response"
              aria-label="Insert canned response"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageSquareText size={14} />
            </button>
          }
        />

        {/* AI Generate */}
        {onRequestAI && (
          <button
            type="button"
            onClick={onRequestAI}
            disabled={isAILoading}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              "text-ai bg-ai-subtle hover:bg-ai/20 disabled:opacity-50"
            )}
          >
            {isAILoading
              ? <Loader2 size={11} className="animate-spin" />
              : <Sparkles size={11} />}
            AI Generate
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-[11px] text-muted-foreground sm:block">
          ⌘↵ to send
        </span>
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!canSend}
          className={cn(
            "h-8 min-w-24",
            mode === "note" && "bg-amber-500 text-white hover:bg-amber-600"
          )}
        >
          {isSubmitting ? (
            <><Loader2 size={13} className="animate-spin mr-1.5" />Sending…</>
          ) : (
            <><Send size={13} className="mr-1.5" />{mode === "note" ? "Add Note" : "Send Reply"}</>
          )}
        </Button>
      </div>
    </div>
  );
}
