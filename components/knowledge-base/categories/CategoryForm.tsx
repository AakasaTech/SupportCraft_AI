"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/features/knowledge-base/actions";

interface Category {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  icon:        string | null;
  sort_order:  number;
}

interface Props {
  category?: Category;
  onDone?:   () => void;
}

const CATEGORY_ICONS = ["📁","📚","💡","🛠️","💳","🔐","⚡","🚀","🎯","📊","🤝","🌐","⚙️","📝","❓"];

export function CategoryForm({ category, onDone }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error,     setError]        = useState<string | null>(null);
  const [name,      setName]         = useState(category?.name ?? "");
  const [slug,      setSlug]         = useState(category?.slug ?? "");
  const [desc,      setDesc]         = useState(category?.description ?? "");
  const [icon,      setIcon]         = useState(category?.icon ?? "📁");
  const [slugTouched, setSlugTouched] = useState(!!category);

  const autoSlug = (n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(autoSlug(v));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, fd)
        : await createCategory(fd);
      if (result?.error) { setError(result.error); return; }
      router.refresh();
      onDone?.();
    });
  };

  const handleDelete = () => {
    if (!category) return;
    if (!confirm(`Delete "${category.name}"? Articles in this category will be uncategorized.`)) return;
    startTransition(async () => {
      await deleteCategory(category.id);
      router.refresh();
      onDone?.();
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Icon picker */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Icon</p>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ICONS.map((ic) => (
            <button
              key={ic}
              type="button"
              onClick={() => setIcon(ic)}
              className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition-colors ${
                icon === ic ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-muted"
              }`}
            >
              {ic}
            </button>
          ))}
        </div>
        <input type="hidden" name="icon" value={icon} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Name *</label>
          <input
            name="name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            placeholder="e.g. Getting Started"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Slug *</label>
          <input
            name="slug"
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
            required
            placeholder="getting-started"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground block mb-1">Description</label>
        <textarea
          name="description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={2}
          placeholder="Brief description of this category"
          className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <input type="hidden" name="sort_order" value="0" />

      <div className="flex items-center gap-2 pt-1">
        {category && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs text-destructive hover:opacity-70 transition-opacity"
          >
            Delete
          </button>
        )}
        <div className="ml-auto flex gap-2">
          {onDone && (
            <button type="button" onClick={onDone}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-semibold disabled:opacity-50"
          >
            {isPending && <Loader2 size={12} className="animate-spin" />}
            {category ? "Save" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}
