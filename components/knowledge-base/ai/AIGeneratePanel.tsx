"use client";

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface GeneratedArticle {
  title:   string;
  excerpt: string;
  content: string;
  tags:    string[];
  seo_title: string;
  seo_description: string;
}

interface Props {
  orgId:     string;
  onGenerate: (article: GeneratedArticle) => void;
}

const TONES    = ["Professional", "Friendly", "Technical", "Simple"];
const LENGTHS  = ["Short (300 words)", "Medium (600 words)", "Long (1200 words)"];

export function AIGeneratePanel({ orgId, onGenerate }: Props) {
  const [expanded, setExpanded]  = useState(false);
  const [loading,  setLoading]   = useState(false);
  const [error,    setError]     = useState<string | null>(null);
  const [topic,    setTopic]     = useState("");
  const [keywords, setKeywords]  = useState("");
  const [tone,     setTone]      = useState(TONES[0]);
  const [length,   setLength]    = useState(LENGTHS[1]);

  const generate = async () => {
    if (!topic.trim()) { setError("Enter a topic first"); return; }
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/kb/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ topic, keywords, tone, length, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      onGenerate(data);
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sc-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-hover transition-colors border-b border-border"
      >
        <div className="p-1 rounded-lg bg-ai-subtle">
          <Sparkles size={13} className="text-ai" />
        </div>
        <span className="text-xs font-semibold flex-1 text-left">AI Article Generator</span>
        {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-3">
          {error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Topic *</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. How to reset your password"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Keywords</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="comma-separated keywords"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground block mb-1">Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LENGTHS.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-ai text-white text-xs font-semibold disabled:opacity-50 transition-opacity hover:opacity-90"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
            {loading ? "Generating…" : "Generate Article"}
          </button>
        </div>
      )}
    </div>
  );
}
