"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, ThumbsUp, ThumbsDown } from "lucide-react";
import { AIBadge } from "./AIBadge";
import { cn } from "@/lib/utils";

interface AIReplyCardProps {
  content: string;
  onInsert?: (content: string) => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  confidence?: number;
  className?: string;
}

export function AIReplyCard({
  content,
  onInsert,
  onRegenerate,
  isLoading,
  confidence,
  className,
}: AIReplyCardProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("sc-ai-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <AIBadge label="AI Suggestion" />
        {confidence !== undefined && (
          <span className="text-xs text-muted-foreground">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      <div
        className={cn(
          "text-sm text-foreground leading-relaxed",
          isLoading && "animate-pulse opacity-60"
        )}
      >
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-skeleton w-full" />
            <div className="h-4 bg-muted rounded animate-skeleton w-5/6" />
            <div className="h-4 bg-muted rounded animate-skeleton w-4/6" />
          </div>
        ) : (
          content
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFeedback("up")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              feedback === "up"
                ? "text-success bg-success-subtle"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            aria-label="Good suggestion"
          >
            <ThumbsUp size={13} />
          </button>
          <button
            onClick={() => setFeedback("down")}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              feedback === "down"
                ? "text-destructive bg-destructive-subtle"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            aria-label="Bad suggestion"
          >
            <ThumbsDown size={13} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                "text-muted-foreground hover:text-foreground hover:bg-muted",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RefreshCw size={11} className={isLoading ? "animate-spin" : ""} />
              Regenerate
            </button>
          )}

          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium",
              "text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            )}
            aria-label="Copy to clipboard"
          >
            {copied ? <Check size={11} className="text-success" /> : <Copy size={11} />}
            {copied ? "Copied" : "Copy"}
          </button>

          {onInsert && (
            <button
              onClick={() => onInsert(content)}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium",
                "sc-gradient-ai text-white",
                "hover:opacity-90 transition-opacity",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              Insert Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
