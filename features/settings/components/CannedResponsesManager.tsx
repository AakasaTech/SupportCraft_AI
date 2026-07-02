"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2, Hash } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  saveCannedResponse,
  deleteCannedResponse,
  type CannedResponse,
} from "@/features/settings/actions/cannedResponses";

interface Props {
  initial: CannedResponse[];
}

const EMPTY: CannedResponse = { name: "", shortcut: "", bodyHtml: "" };

export function CannedResponsesManager({ initial }: Props) {
  const [items,   setItems]   = useState<CannedResponse[]>(initial);
  const [editing, setEditing] = useState<CannedResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  function openNew()                      { setEditing({ ...EMPTY }); }
  function openEdit(item: CannedResponse) { setEditing({ ...item }); }
  function closeForm()                    { setEditing(null); }

  function handleSave() {
    if (!editing) return;
    if (!editing.name.trim())     { toast.error("Name is required");     return; }
    if (!editing.shortcut.trim()) { toast.error("Shortcut is required"); return; }
    if (!editing.bodyHtml.trim()) { toast.error("Content is required");  return; }

    startTransition(async () => {
      const result = await saveCannedResponse(editing);
      if (result.error) { toast.error(result.error); return; }

      const saved: CannedResponse = { ...editing, id: result.id };
      setItems(prev =>
        editing.id
          ? prev.map(r => r.id === editing.id ? saved : r)
          : [...prev, saved]
      );
      toast.success(editing.id ? "Updated" : "Canned response created");
      closeForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteCannedResponse(id);
      if (result.error) { toast.error(result.error); return; }
      setItems(prev => prev.filter(r => r.id !== id));
      toast.success("Deleted");
    });
  }

  return (
    <div className="space-y-4">
      {/* List */}
      {items.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">No canned responses yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Create one to insert pre-written replies quickly in the ticket composer.
          </p>
        </div>
      )}

      {items.map(item => (
        <div
          key={item.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">{item.name}</span>
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-mono">
                <Hash size={9} />
                {item.shortcut}
              </span>
            </div>
            <div
              className="text-xs text-muted-foreground line-clamp-2 sc-message-html"
              dangerouslySetInnerHTML={{ __html: item.bodyHtml }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => openEdit(item)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Edit"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => item.id && handleDelete(item.id)}
              disabled={isPending}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
              aria-label="Delete"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}

      {/* Inline form */}
      {editing ? (
        <div className="rounded-xl border border-primary/30 bg-primary-subtle/30 p-4 space-y-3">
          <p className="text-sm font-semibold text-foreground">
            {editing.id ? "Edit canned response" : "New canned response"}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={e => setEditing(prev => prev && ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Greeting"
                className="sc-input w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">
                Shortcut <span className="text-muted-foreground font-normal">(no spaces)</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">#</span>
                <input
                  type="text"
                  value={editing.shortcut}
                  onChange={e => setEditing(prev => prev && ({
                    ...prev,
                    shortcut: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                  }))}
                  placeholder="greeting"
                  className="sc-input w-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">Content</label>
            <textarea
              value={editing.bodyHtml}
              onChange={e => setEditing(prev => prev && ({ ...prev, bodyHtml: e.target.value }))}
              rows={5}
              placeholder="Type the reply content. HTML is supported."
              className="sc-input w-full resize-y font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Basic HTML is supported: &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;p&gt;, &lt;br&gt;
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={closeForm} disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 size={13} className="animate-spin mr-1.5" />}
              {editing.id ? "Save changes" : "Create"}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={openNew} className="gap-1.5">
          <Plus size={14} />
          New canned response
        </Button>
      )}
    </div>
  );
}
