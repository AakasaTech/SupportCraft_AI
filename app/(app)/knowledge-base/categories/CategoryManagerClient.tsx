"use client";

import { useState } from "react";
import { Plus, Pencil, BookOpen } from "lucide-react";
import { CategoryForm } from "@/components/knowledge-base/categories/CategoryForm";

interface Category {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  icon:        string | null;
  sort_order:  number;
  is_archived: boolean;
}

interface Props {
  categories: Category[];
  countMap:   Record<string, number>;
}

export function CategoryManagerClient({ categories, countMap }: Props) {
  const [showNew,    setShowNew]    = useState(false);
  const [editingId,  setEditingId]  = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Category cards */}
      <div className="grid gap-3">
        {categories.filter((c) => !c.is_archived).map((cat) => (
          <div key={cat.id} className="sc-card p-4">
            {editingId === cat.id ? (
              <CategoryForm category={cat} onDone={() => setEditingId(null)} />
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{cat.icon ?? "📁"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm text-foreground">{cat.name}</p>
                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                      /{cat.slug}
                    </span>
                  </div>
                  {cat.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{cat.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <BookOpen size={12} />
                    {countMap[cat.id] ?? 0}
                  </span>
                  <button
                    onClick={() => setEditingId(cat.id)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {categories.filter((c) => !c.is_archived).length === 0 && !showNew && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No categories yet. Create one to organize your articles.
          </div>
        )}
      </div>

      {/* New category form */}
      {showNew ? (
        <div className="sc-card p-4">
          <h3 className="text-sm font-semibold mb-4">New Category</h3>
          <CategoryForm onDone={() => setShowNew(false)} />
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors w-full justify-center"
        >
          <Plus size={14} />
          Add Category
        </button>
      )}
    </div>
  );
}
