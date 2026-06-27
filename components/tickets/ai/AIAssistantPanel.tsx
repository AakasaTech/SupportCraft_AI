"use client";

import { useState } from "react";
import {
  Bot, Sparkles, Loader2, Copy, CheckCheck, ChevronDown, ChevronUp,
  Wand2, FileText, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ReplyTone, ImprovementAction } from "@/lib/ai/types";

interface Props {
  ticketId:      string;
  ticketTitle:   string;
  ticketContent: string;
  orgId:         string;
  onSuggestion?: (text: string) => void;
  currentReply?: string;
}

type ActiveView = "reply" | "improve" | "summarize" | null;

const TONES: { value: ReplyTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly",     label: "Friendly"     },
  { value: "empathetic",   label: "Empathetic"   },
  { value: "concise",      label: "Concise"      },
  { value: "formal",       label: "Formal"       },
];

const IMPROVE_ACTIONS: { value: ImprovementAction; label: string }[] = [
  { value: "improve",   label: "Improve"   },
  { value: "shorten",   label: "Shorten"   },
  { value: "expand",    label: "Expand"    },
  { value: "formalize", label: "Formalize" },
  { value: "simplify",  label: "Simplify"  },
];

export function AIAssistantPanel({
  ticketId,
  onSuggestion,
  currentReply = "",
}: Props) {
  const [activeView,    setActiveView]    = useState<ActiveView>(null);
  const [tone,          setTone]          = useState<ReplyTone>("professional");
  const [improveAction, setImproveAction] = useState<ImprovementAction>("improve");
  const [result,        setResult]        = useState<string>("");
  const [summary,       setSummary]       = useState<{
    summary: string; keyPoints: string[]; suggestedNext: string
  } | null>(null);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [copied,        setCopied]        = useState(false);
  const [expanded,      setExpanded]      = useState(true);

  const fetchReply = async (selectedTone?: ReplyTone) => {
    setActiveView("reply");
    setIsLoading(true);
    setError(null);
    setResult("");
    setSummary(null);
    try {
      const res  = await fetch("/api/ai/reply", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ticketId, tone: selectedTone ?? tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI request failed");
      setResult(data.suggestion ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImprove = async () => {
    if (!currentReply.trim()) {
      setError("Type a reply first, then improve it");
      return;
    }
    setActiveView("improve");
    setIsLoading(true);
    setError(null);
    setResult("");
    setSummary(null);
    try {
      const res  = await fetch("/api/ai/improve", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: currentReply, action: improveAction }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI request failed");
      setResult(data.text ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    setActiveView("summarize");
    setIsLoading(true);
    setError(null);
    setResult("");
    setSummary(null);
    try {
      const res  = await fetch("/api/ai/summarize", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ticketId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI request failed");
      setSummary(data.summary ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI request failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = result || summary?.summary || "";
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasOutput = !!(result || summary);

  return (
    <div className="sc-card overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3 border-b border-border flex items-center gap-2 hover:bg-hover transition-colors"
      >
        <div className="p-1 rounded-lg bg-ai-subtle">
          <Bot size={13} className="text-ai" />
        </div>
        <span className="text-xs font-semibold flex-1 text-left">AI Assistant</span>
        {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-3 space-y-3">

          {/* Reply section */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Generate Reply</p>
            <div className="flex flex-wrap gap-1">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setTone(t.value); fetchReply(t.value); }}
                  disabled={isLoading}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border",
                    tone === t.value && activeView === "reply" && result
                      ? "bg-ai text-white border-ai"
                      : "bg-transparent border-border text-muted-foreground hover:border-ai hover:text-ai"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => fetchReply(tone)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-ai-subtle hover:bg-ai/20 text-ai text-xs font-medium transition-colors"
            >
              {isLoading && activeView === "reply"
                ? <Loader2 size={12} className="animate-spin" />
                : <Sparkles size={12} />}
              Generate Reply
            </button>
          </div>

          {/* Improve section */}
          <div className="space-y-2 pt-1 border-t border-border">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide pt-1">Improve Reply</p>
            <div className="flex flex-wrap gap-1">
              {IMPROVE_ACTIONS.map((a) => (
                <button
                  key={a.value}
                  onClick={() => setImproveAction(a.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border",
                    improveAction === a.value
                      ? "bg-muted border-border text-foreground"
                      : "bg-transparent border-border text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button
              onClick={fetchImprove}
              disabled={isLoading || !currentReply.trim()}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors disabled:opacity-40"
            >
              {isLoading && activeView === "improve"
                ? <Loader2 size={12} className="animate-spin" />
                : <Wand2 size={12} />}
              Improve
            </button>
          </div>

          {/* Summarize */}
          <div className="pt-1 border-t border-border">
            <button
              onClick={fetchSummary}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors mt-1"
            >
              {isLoading && activeView === "summarize"
                ? <Loader2 size={12} className="animate-spin" />
                : <FileText size={12} />}
              Summarize Ticket
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && !hasOutput && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-ai-subtle/30 text-xs text-ai">
              <Loader2 size={13} className="animate-spin" />
              AI is thinking…
            </div>
          )}

          {/* Reply / Improve result */}
          {result && (
            <div className="rounded-xl border border-ai/20 bg-ai-subtle/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-ai uppercase tracking-wide">
                  {activeView === "improve"
                    ? `${improveAction.charAt(0).toUpperCase()}${improveAction.slice(1)}d`
                    : `${tone.charAt(0).toUpperCase()}${tone.slice(1)} Reply`}
                </p>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => fetchReply(tone)}>
                    <RefreshCw size={9} className="mr-1" />Retry
                  </Button>
                  <Button size="sm" variant="default" className="h-6 text-[10px] px-2"
                    onClick={() => onSuggestion?.(result)}>
                    Use
                  </Button>
                  <button onClick={handleCopy} className="p-1 rounded hover:bg-ai/10 transition-colors" title="Copy">
                    {copied ? <CheckCheck size={12} className="text-success" /> : <Copy size={12} className="text-muted-foreground" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}

          {/* Summary result */}
          {summary && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Summary</p>
                <button onClick={handleCopy} className="p-1 rounded hover:bg-muted transition-colors" title="Copy">
                  {copied ? <CheckCheck size={12} className="text-success" /> : <Copy size={12} className="text-muted-foreground" />}
                </button>
              </div>
              <p className="text-xs text-foreground leading-relaxed">{summary.summary}</p>
              {summary.keyPoints.length > 0 && (
                <ul className="space-y-1">
                  {summary.keyPoints.map((pt, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex gap-1.5">
                      <span className="text-ai shrink-0">•</span>{pt}
                    </li>
                  ))}
                </ul>
              )}
              {summary.suggestedNext && (
                <div className="pt-1 border-t border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Suggested Next</p>
                  <p className="text-[11px] text-foreground">{summary.suggestedNext}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
