"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, BookOpen, ArrowRight, Lightbulb } from "lucide-react";
import Link from "next/link";
import { portalCreateTicket } from "@/features/tickets/actions/portalActions";
import type { PortalCustomer } from "@/lib/portal/customer";

interface Props {
  customers: PortalCustomer[];
}

interface KBArticle {
  id:       string;
  title:    string;
  category: string | null;
}

const PRIORITY_OPTIONS = [
  { value: "low",    label: "Low — no immediate urgency" },
  { value: "medium", label: "Medium — impacts work, workaround exists" },
  { value: "high",   label: "High — significant impact, no workaround" },
  { value: "urgent", label: "Urgent — critical, blocking all work" },
];

export function PortalCreateTicketForm({ customers }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error,     setError]     = useState<string | null>(null);
  const [title,     setTitle]     = useState("");
  const [articles,  setArticles]  = useState<KBArticle[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const orgIds = [...new Set(customers.map((c) => c.org_id))];
  const orgs   = [...new Map(customers.map((c) => [c.org_id, { id: c.org_id, name: c.org_name }])).values()];

  // Debounced KB search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (title.trim().length < 3) { setArticles([]); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch("/api/portal/kb-suggest", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ query: title.trim(), orgIds }),
        });
        const data = await res.json() as { articles: KBArticle[] };
        setArticles(data.articles ?? []);
      } catch {
        setArticles([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await portalCreateTicket(fd);
      if (result?.error) {
        setError(result.error);
      } else if (result?.ticketId) {
        router.push(`/portal/tickets/${result.ticketId}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}

      {orgs.length > 1 ? (
        <div>
          <label htmlFor="orgId" className="text-sm font-medium text-foreground block mb-1.5">
            Organization
          </label>
          <select
            id="orgId"
            name="orgId"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
          >
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="orgId" value={orgs[0]?.id ?? ""} />
      )}

      <div>
        <label htmlFor="title" className="text-sm font-medium text-foreground block mb-1.5">
          Subject <span className="text-destructive">*</span>
        </label>
        <input
          id="title"
          type="text"
          name="title"
          required
          minLength={3}
          maxLength={200}
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of your issue"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      {/* KB suggestions */}
      {(articles.length > 0 || searching) && (
        <div className="rounded-xl border border-border bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-primary shrink-0" />
            <p className="text-xs font-semibold text-primary">
              {searching ? "Searching knowledge base…" : "These articles might help:"}
            </p>
            {searching && <Loader2 size={12} className="animate-spin text-primary" />}
          </div>
          {articles.length > 0 && (
            <div className="space-y-1.5">
              {articles.map((a) => (
                <Link
                  key={a.id}
                  href={`/portal/knowledge-base/${a.id}`}
                  target="_blank"
                  className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-primary/10 transition-colors group"
                >
                  <BookOpen size={13} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors flex-1 truncate">
                    {a.title}
                  </span>
                  {a.category && (
                    <span className="text-xs text-muted-foreground shrink-0">{a.category}</span>
                  )}
                  <ArrowRight size={12} className="text-muted-foreground shrink-0 group-hover:text-primary" />
                </Link>
              ))}
              <p className="text-xs text-muted-foreground pt-1 pl-1">
                Does one of these solve your issue? If not, continue below.
              </p>
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="description" className="text-sm font-medium text-foreground block mb-1.5">
          Description <span className="text-destructive">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={7}
          placeholder="Describe your issue in detail. Include any steps to reproduce, error messages, or screenshots if relevant."
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      <div>
        <label htmlFor="priority" className="text-sm font-medium text-foreground block mb-1.5">
          Priority
        </label>
        <select
          id="priority"
          name="priority"
          defaultValue="medium"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/portal/tickets"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isPending
            ? <><Loader2 size={14} className="animate-spin" />Submitting…</>
            : <><Send size={14} />Submit Ticket</>}
        </button>
      </div>
    </form>
  );
}
