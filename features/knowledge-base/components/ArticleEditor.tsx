"use client";

import { useTransition, useState, useCallback } from "react";
import { useRouter }                            from "next/navigation";
import {
  Loader2, Trash2, Eye, Save, Globe, Lock, Building2,
  Tag, Search, ChevronDown, FileText, Wand2,
} from "lucide-react";
import { cn }                from "@/lib/utils";
import { TipTapEditor }      from "@/components/knowledge-base/editor/TipTapEditor";
import { VersionHistory }    from "@/components/knowledge-base/articles/VersionHistory";
import { AIGeneratePanel }   from "@/components/knowledge-base/ai/AIGeneratePanel";
import { createArticle, updateArticle, deleteArticle } from "../actions";

interface Category {
  id:   string;
  name: string;
  icon: string | null;
}

interface Version {
  id:             string;
  version_number: number;
  change_summary: string | null;
  created_at:     string;
}

interface Article {
  id:              string;
  title:           string;
  content:         string;
  excerpt?:        string | null;
  status:          string;
  visibility:      string;
  category?:       string | null;
  category_id?:    string | null;
  tags:            string[];
  seo_title?:      string | null;
  seo_description?: string | null;
  cover_image_url?: string | null;
  version:         number;
}

interface Props {
  article?:   Article;
  categories: Category[];
  versions?:  Version[];
  orgId:      string;
}

const STATUS_OPTIONS = [
  { value: "draft",     label: "Draft",     color: "text-muted-foreground" },
  { value: "review",    label: "In Review", color: "text-amber-600"        },
  { value: "published", label: "Published", color: "text-success"          },
  { value: "archived",  label: "Archived",  color: "text-muted-foreground" },
];

const VISIBILITY_OPTIONS = [
  { value: "public",   label: "Public",        icon: Globe     },
  { value: "internal", label: "Internal Only", icon: Building2 },
  { value: "private",  label: "Private",       icon: Lock      },
];

export function ArticleEditor({ article, categories, versions = [], orgId }: Props) {
  const router = useRouter();
  const [isPending,  startTransition] = useTransition();
  const [isDeleting, setIsDeleting]   = useState(false);
  const [error,      setError]        = useState<string | null>(null);
  const [saved,      setSaved]        = useState(false);

  const [title,      setTitle]      = useState(article?.title ?? "");
  const [content,    setContent]    = useState(article?.content ?? "");
  const [excerpt,    setExcerpt]    = useState(article?.excerpt ?? "");
  const [status,     setStatus]     = useState(article?.status ?? "draft");
  const [visibility, setVisibility] = useState(article?.visibility ?? "public");
  const [categoryId, setCategoryId] = useState(article?.category_id ?? "");
  const [tagsInput,  setTagsInput]  = useState(article?.tags?.join(", ") ?? "");
  const [seoTitle,   setSeoTitle]   = useState(article?.seo_title ?? "");
  const [seoDesc,    setSeoDesc]    = useState(article?.seo_description ?? "");
  const [changeSummary, setChangeSummary] = useState("");
  const [showSEO,    setShowSEO]    = useState(false);

  const buildFormData = () => {
    const fd = new FormData();
    fd.set("title",           title);
    fd.set("content",         content);
    fd.set("excerpt",         excerpt);
    fd.set("status",          status);
    fd.set("visibility",      visibility);
    if (categoryId) fd.set("category_id", categoryId);
    fd.set("tags",            tagsInput);
    fd.set("seo_title",       seoTitle);
    fd.set("seo_description", seoDesc);
    fd.set("change_summary",  changeSummary || "Updated");
    return fd;
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = article
        ? await updateArticle(article.id, buildFormData())
        : await createArticle(buildFormData());

      if (result && "error" in result) {
        setError(result.error ?? null);
      } else if (!article) {
        // redirect handled server-side
      } else {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 2500);
      }
    });
  };

  const handleDelete = () => {
    if (!article) return;
    if (!confirm("Delete this article? This cannot be undone.")) return;
    setIsDeleting(true);
    startTransition(async () => { await deleteArticle(article.id); });
  };

  const handleGenerated = useCallback((generated: {
    title: string; excerpt: string; content: string;
    tags: string[]; seo_title: string; seo_description: string;
  }) => {
    setTitle(generated.title);
    setContent(generated.content);
    setExcerpt(generated.excerpt);
    setTagsInput(generated.tags.join(", "));
    setSeoTitle(generated.seo_title);
    setSeoDesc(generated.seo_description);
  }, []);

  const wordCount = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const readTime  = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex gap-6 items-start">

      {/* ── Main editor ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
        )}

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title…"
          className="w-full text-2xl font-bold text-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground/50 py-1"
        />

        {/* Excerpt */}
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Short excerpt (shown in search results and article lists)…"
          rows={2}
          className="w-full resize-none text-sm text-muted-foreground bg-transparent border-0 outline-none placeholder:text-muted-foreground/40 leading-relaxed"
        />

        {/* TipTap */}
        <TipTapEditor
          value={content}
          onChange={setContent}
          placeholder="Start writing your article…"
        />

        {/* Footer stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1">
          <span>{wordCount} words</span>
          <span>~{readTime} min read</span>
          {article && <span>Version {article.version}</span>}
        </div>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-72 shrink-0 space-y-3 sticky top-4">

        {/* Save / Status row */}
        <div className="sc-card p-4 space-y-3">
          {/* Status */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Status</label>
            <div className="flex flex-wrap gap-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    status === s.value
                      ? "bg-primary text-white border-primary"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Visibility</label>
            <div className="flex gap-1">
              {VISIBILITY_OPTIONS.map(({ value: v, label, icon: Icon }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVisibility(v)}
                  title={label}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors",
                    visibility === v
                      ? "bg-muted border-border text-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  <Icon size={11} />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Change summary */}
          {article && (
            <div>
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block mb-1">Change Summary</label>
              <input
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="What changed?"
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            {article && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isPending}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Delete article"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
                saved
                  ? "bg-success/10 text-success"
                  : "bg-primary text-white hover:opacity-90"
              )}
            >
              {isPending
                ? <><Loader2 size={12} className="animate-spin" />Saving…</>
                : saved
                  ? "Saved ✓"
                  : <><Save size={12} />{article ? "Save" : "Create"}</>}
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="sc-card p-4 space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? ""} {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="sc-card p-4 space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
            <Tag size={11} /> Tags
          </label>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="billing, account, password"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[10px] text-muted-foreground">Comma-separated</p>
        </div>

        {/* SEO */}
        <div className="sc-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSEO((v) => !v)}
            className="w-full px-4 py-3 flex items-center gap-2 hover:bg-hover transition-colors border-b border-border"
          >
            <Search size={13} className="text-muted-foreground" />
            <span className="text-xs font-semibold flex-1 text-left">SEO</span>
            <ChevronDown size={13} className={cn("text-muted-foreground transition-transform", showSEO && "rotate-180")} />
          </button>
          {showSEO && (
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">SEO Title <span className="opacity-60">{seoTitle.length}/70</span></label>
                <input
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value.slice(0, 70))}
                  placeholder={title}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Meta Description <span className="opacity-60">{seoDesc.length}/160</span></label>
                <textarea
                  value={seoDesc}
                  onChange={(e) => setSeoDesc(e.target.value.slice(0, 160))}
                  rows={3}
                  placeholder={excerpt || "Describe this article for search engines…"}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Generator */}
        <AIGeneratePanel orgId={orgId} onGenerate={handleGenerated} />

        {/* Version History */}
        {article && versions.length > 0 && (
          <VersionHistory
            articleId={article.id}
            versions={versions}
            current={article.version}
          />
        )}
      </aside>
    </div>
  );
}
