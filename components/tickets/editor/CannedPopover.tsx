"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, MessageSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Editor } from "@tiptap/react";
import type { CannedResponse } from "./types";

interface Props {
  editor: Editor | null;
  trigger: React.ReactNode;
}

export function CannedPopover({ editor, trigger }: Props) {
  const [open,      setOpen]      = useState(false);
  const [query,     setQuery]     = useState("");
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [active,    setActive]    = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/canned-responses");
      if (res.ok) setResponses(await res.json());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { load(); setQuery(""); setActive(0); }
  }, [open, load]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = query
    ? responses.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.shortcut?.toLowerCase().includes(query.toLowerCase())
      )
    : responses;

  const insert = (r: CannedResponse) => {
    editor?.chain().focus().insertContent(r.body).run();
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter")     { e.preventDefault(); if (filtered[active]) insert(filtered[active]); }
    if (e.key === "Escape")    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-80 p-0"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search canned responses…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div role="listbox" className="max-h-64 overflow-y-auto">
          {loading && (
            <p className="p-4 text-center text-xs text-muted-foreground">Loading…</p>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-6 text-center">
              <MessageSquare size={20} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                {query ? "No matching responses" : "No canned responses yet"}
              </p>
            </div>
          )}
          {filtered.map((r, i) => (
            <button
              key={r.id}
              role="option"
              aria-selected={i === active}
              onClick={() => insert(r)}
              onMouseEnter={() => setActive(i)}
              className={`w-full text-left px-3 py-2.5 transition-colors ${i === active ? "bg-muted" : "hover:bg-muted/60"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-foreground truncate">{r.title}</span>
                {r.shortcut && (
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                    {r.shortcut}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: r.body.replace(/<[^>]+>/g, " ").slice(0, 100) }}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
