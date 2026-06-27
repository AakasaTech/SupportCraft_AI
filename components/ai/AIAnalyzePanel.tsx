"use client";

import { useState } from "react";
import {
  Sparkles, Loader2, CheckCheck, Tags, AlertTriangle, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SentimentBadge } from "./SentimentBadge";
import type { ClassificationResult, SentimentResult } from "@/lib/ai/types";

interface Props {
  ticketId: string;
  onApply?: (fields: Partial<{ priority: string; category: string; tags: string[] }>) => void;
}

type ApplyState = "idle" | "applying" | "done";

export function AIAnalyzePanel({ ticketId, onApply }: Props) {
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [result,      setResult]      = useState<{
    classification: ClassificationResult;
    sentiment:      SentimentResult;
  } | null>(null);
  const [applyState,  setApplyState]  = useState<ApplyState>("idle");

  const analyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res  = await fetch("/api/ai/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const applyAll = async () => {
    if (!result) return;
    setApplyState("applying");
    try {
      await fetch("/api/ai/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ticketId, applyToTicket: true }),
      });
      onApply?.({
        priority: result.classification.priority,
        category: result.classification.category,
        tags:     result.classification.tags,
      });
      setApplyState("done");
    } catch {
      setApplyState("idle");
    }
  };

  const PRIORITY_COLOR: Record<string, string> = {
    urgent: "text-red-600 bg-red-50",
    high:   "text-orange-600 bg-orange-50",
    medium: "text-amber-600 bg-amber-50",
    low:    "text-slate-600 bg-slate-100",
  };

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <div className="p-1 rounded-lg bg-ai-subtle">
          <Sparkles size={13} className="text-ai" />
        </div>
        <span className="text-xs font-semibold flex-1">AI Analysis</span>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2"
          onClick={analyze}
          disabled={loading}
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : "Analyze"}
        </Button>
      </div>

      <div className="p-3 space-y-3">
        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {loading && !result && (
          <div className="flex items-center gap-2 text-xs text-ai p-2">
            <Loader2 size={12} className="animate-spin" />
            Analyzing ticket…
          </div>
        )}

        {result && (
          <>
            {/* Priority */}
            <div className="flex items-center gap-2">
              <AlertTriangle size={12} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground w-16 shrink-0">Priority</span>
              <span className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize",
                PRIORITY_COLOR[result.classification.priority] ?? "text-foreground bg-muted"
              )}>
                {result.classification.priority}
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center gap-2">
              <Tags size={12} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground w-16 shrink-0">Category</span>
              <span className="text-[11px] font-medium text-foreground">{result.classification.category}</span>
            </div>

            {/* Tags */}
            {result.classification.tags.length > 0 && (
              <div className="flex items-start gap-2">
                <Tags size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-[11px] text-muted-foreground w-16 shrink-0">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {result.classification.tags.map((tag) => (
                    <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Sentiment */}
            <div className="flex items-center gap-2">
              <Smile size={12} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground w-16 shrink-0">Sentiment</span>
              <SentimentBadge sentiment={result.sentiment.label} score={result.sentiment.score} />
            </div>

            {result.sentiment.explanation && (
              <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">
                {result.sentiment.explanation}
              </p>
            )}

            {/* Apply button */}
            <Button
              size="sm"
              className="w-full h-7 text-[11px] mt-1"
              onClick={applyAll}
              disabled={applyState !== "idle"}
              variant={applyState === "done" ? "outline" : "default"}
            >
              {applyState === "applying" && <Loader2 size={11} className="animate-spin mr-1" />}
              {applyState === "done"     && <CheckCheck size={11} className="mr-1 text-success" />}
              {applyState === "idle"     ? "Apply to Ticket" : applyState === "applying" ? "Applying…" : "Applied"}
            </Button>
          </>
        )}

        {!result && !loading && !error && (
          <p className="text-[11px] text-muted-foreground text-center py-2">
            Run analysis to detect priority, category, and sentiment
          </p>
        )}
      </div>
    </div>
  );
}
