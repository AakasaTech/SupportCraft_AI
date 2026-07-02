"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Users } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Editor } from "@tiptap/react";
import type { Agent } from "./types";

interface Props {
  editor:  Editor | null;
  trigger: React.ReactNode;
}

export function MentionPopover({ editor, trigger }: Props) {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [agents,  setAgents]  = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      if (res.ok) setAgents(await res.json());
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
    ? agents.filter(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.role.toLowerCase().includes(query.toLowerCase())
      )
    : agents;

  const insert = (agent: Agent) => {
    editor?.chain().focus().insertContent(`@${agent.name} `).run();
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
        className="w-64 p-0"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input
            ref={searchRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search agents…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div role="listbox" className="max-h-56 overflow-y-auto">
          {loading && (
            <p className="p-4 text-center text-xs text-muted-foreground">Loading…</p>
          )}
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 p-5 text-center">
              <Users size={20} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No agents found</p>
            </div>
          )}
          {filtered.map((agent, i) => (
            <button
              key={agent.id}
              role="option"
              aria-selected={i === active}
              onClick={() => insert(agent)}
              onMouseEnter={() => setActive(i)}
              className={`w-full flex items-center gap-2.5 text-left px-3 py-2 transition-colors ${i === active ? "bg-muted" : "hover:bg-muted/60"}`}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {agent.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-foreground truncate">{agent.name}</p>
                <p className="text-[11px] text-muted-foreground">{agent.role}</p>
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
