import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, Search, ArrowRight, FolderOpen } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";

export const metadata: Metadata = { title: "Knowledge Base" };

export default async function PortalKnowledgeBasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) redirect("/portal/dashboard");

  const { q } = await searchParams;
  const query  = q?.trim() ?? "";

  const orgIds = [...new Set(customers.map((c) => c.org_id))];
  const admin  = createAdminClient();

  let articlesQuery = admin
    .from("knowledge_articles")
    .select("id, title, category, updated_at")
    .in("org_id", orgIds)
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (query) {
    articlesQuery = articlesQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
  }

  const { data: articles } = await articlesQuery.limit(100);
  const allArticles = articles ?? [];

  // Group by category
  const grouped = new Map<string, typeof allArticles>();
  for (const article of allArticles) {
    const cat = article.category || "General";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(article);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Knowledge Base</h1>
        <p className="text-muted-foreground mt-1">
          Find answers to common questions and learn how to get the most out of your support.
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search articles…"
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
        />
      </form>

      {query && (
        <p className="text-sm text-muted-foreground">
          {allArticles.length === 0
            ? `No results for "${query}"`
            : `${allArticles.length} result${allArticles.length !== 1 ? "s" : ""} for "${query}"`}
        </p>
      )}

      {allArticles.length === 0 && !query && (
        <div className="sc-card p-10 text-center space-y-3">
          <BookOpen size={32} className="text-muted-foreground mx-auto" />
          <p className="font-medium text-foreground">No articles published yet</p>
          <p className="text-sm text-muted-foreground">Check back soon or contact support directly.</p>
        </div>
      )}

      {/* Category groups */}
      {Array.from(grouped.entries()).map(([category, catArticles]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {category}
            </h2>
            <span className="text-xs text-muted-foreground">({catArticles.length})</span>
          </div>
          <div className="space-y-2">
            {catArticles.map((article) => (
              <Link
                key={article.id}
                href={`/portal/knowledge-base/${article.id}`}
                className="sc-card p-4 flex items-center gap-3 hover:border-primary/40 transition-colors group"
              >
                <div className="p-1.5 rounded-lg bg-muted shrink-0">
                  <BookOpen size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {article.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Updated {new Date(article.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <ArrowRight size={14} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
