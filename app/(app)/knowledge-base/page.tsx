import type { Metadata } from "next";
import Link              from "next/link";
import {
  Plus, Search, BookOpen, Folder, TrendingUp, BarChart2, Settings,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma }      from "@/lib/prisma";
import type { Prisma, ArticleStatus } from "@/lib/generated/prisma/client";
import { cn }           from "@/lib/utils";
import { formatDate }   from "@/lib/utils";

export const metadata: Metadata = { title: "Knowledge Base" };

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground" },
  review:    { label: "Review",    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  published: { label: "Published", className: "bg-success/10 text-success" },
  archived:  { label: "Archived",  className: "bg-muted text-muted-foreground/60" },
};

const VISIBILITY_ICON: Record<string, string> = {
  public:   "🌐",
  internal: "🏢",
  private:  "🔒",
};

interface SearchParams {
  q?:          string;
  status?:     string;
  category_id?: string;
}

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function KnowledgeBasePage({ searchParams }: Props) {
  const sp      = await searchParams;
  const query   = sp.q ?? "";
  const statusFilter = sp.status ?? "";
  const catFilter    = sp.category_id ?? "";

  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const articleWhere: Prisma.KnowledgeArticleWhereInput = {
    organizationId: orgId,
    ...(statusFilter ? { status: statusFilter as ArticleStatus } : {}),
    ...(catFilter ? { categoryId: catFilter } : {}),
    ...(query
      ? {
          OR: [
            { title:   { contains: query, mode: "insensitive" } },
            { excerpt: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [categories, articleRows] = await Promise.all([
    prisma.kbCategory.findMany({
      where:   { organizationId: orgId, isArchived: false },
      select:  { id: true, name: true, icon: true, slug: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.knowledgeArticle.findMany({
      where:  articleWhere,
      select: {
        id: true, title: true, excerpt: true, status: true, visibility: true, category: true,
        categoryId: true, tags: true, viewsCount: true, helpfulVotes: true, readingTimeMin: true,
        updatedAt: true, publishedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const articles = articleRows.map((a) => ({
    id: a.id, title: a.title, excerpt: a.excerpt, status: a.status, visibility: a.visibility,
    category: a.category, category_id: a.categoryId, tags: a.tags, views_count: a.viewsCount,
    helpful_votes: a.helpfulVotes, reading_time_min: a.readingTimeMin, updated_at: a.updatedAt,
    published_at: a.publishedAt,
  }));

  const totalPublished = articles.filter((a) => a.status === "published").length;
  const totalDrafts    = articles.filter((a) => a.status === "draft").length;
  const totalReview    = articles.filter((a) => a.status === "review").length;
  const totalViews     = articles.reduce((s, a) => s + (a.views_count ?? 0), 0);

  // Category lookup
  const catMap: Record<string, { name: string; icon: string | null }> = {};
  categories.forEach((c) => { catMap[c.id] = { name: c.name, icon: c.icon }; });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookOpen size={20} className="text-primary" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalPublished} published · {totalDrafts} drafts
            {totalReview > 0 && ` · ${totalReview} in review`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/knowledge-base/analytics"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <BarChart2 size={14} />
            Analytics
          </Link>
          <Link
            href="/knowledge-base/categories"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Folder size={14} />
            Categories
          </Link>
          <Link
            href="/knowledge-base/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            New Article
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 px-6">
        {[
          { label: "Published",  value: totalPublished, icon: BookOpen,   color: "text-success"        },
          { label: "Drafts",     value: totalDrafts,    icon: Settings,   color: "text-muted-foreground" },
          { label: "In Review",  value: totalReview,    icon: TrendingUp, color: "text-amber-500"       },
          { label: "Total Views",value: totalViews,     icon: BarChart2,  color: "text-primary"         },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="sc-card p-4 flex items-center gap-3">
            <Icon size={16} className={color} />
            <div>
              <p className="text-lg font-bold text-foreground">{value}</p>
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 px-6">
        <form method="GET" className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search articles…"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {(categories ?? []).length > 0 && (
            <select
              name="category_id"
              defaultValue={catFilter}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">All Categories</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.icon ?? ""} {c.name}</option>
              ))}
            </select>
          )}

          <button type="submit"
            className="px-4 py-2 rounded-xl bg-muted text-sm text-foreground hover:bg-muted/80 transition-colors">
            Filter
          </button>

          {(query || statusFilter || catFilter) && (
            <Link href="/knowledge-base" className="text-xs text-muted-foreground hover:text-foreground">
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Article list */}
      <div className="px-6 pb-6 space-y-2">
        {articles.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={32} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-foreground">
              {query || statusFilter || catFilter ? "No articles match your filters" : "No articles yet"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {query || statusFilter || catFilter
                ? "Try adjusting your search"
                : "Create articles to help customers self-serve and improve AI reply quality"}
            </p>
            {!query && !statusFilter && !catFilter && (
              <Link
                href="/knowledge-base/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold"
              >
                <Plus size={14} />New Article
              </Link>
            )}
          </div>
        ) : (
          articles.map((article) => {
            const statusCfg = STATUS_CONFIG[article.status] ?? STATUS_CONFIG.draft;
            const cat       = article.category_id ? catMap[article.category_id] : null;
            return (
              <Link
                key={article.id}
                href={`/knowledge-base/${article.id}`}
                className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm text-foreground">{article.title}</h3>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusCfg.className)}>
                      {statusCfg.label}
                    </span>
                    {article.visibility && article.visibility !== "public" && (
                      <span className="text-[11px]" title={article.visibility}>
                        {VISIBILITY_ICON[article.visibility]}
                      </span>
                    )}
                  </div>
                  {article.excerpt && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{article.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {cat && (
                      <span className="text-xs text-muted-foreground">
                        {cat.icon ?? "📁"} {cat.name}
                      </span>
                    )}
                    {!cat && article.category && (
                      <span className="text-xs text-muted-foreground">{article.category}</span>
                    )}
                    {article.reading_time_min && (
                      <span className="text-xs text-muted-foreground">{article.reading_time_min} min</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Updated {formatDate(article.updated_at)}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="hidden lg:flex items-center gap-1 shrink-0 flex-wrap max-w-[180px]">
                    {article.tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-xs text-muted-foreground">
                  {article.views_count > 0 && <span>{article.views_count} views</span>}
                  {article.helpful_votes > 0 && <span className="text-success">👍 {article.helpful_votes}</span>}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
