import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Tag } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { ArticleFeedback } from "@/components/knowledge-base/articles/ArticleFeedback";
import { ViewTracker }     from "@/components/knowledge-base/articles/ViewTracker";
import { ArticleContent }  from "@/components/knowledge-base/articles/ArticleContent";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Article" };
}

export default async function PortalArticlePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) redirect("/portal/dashboard");

  const orgIds = [...new Set(customers.map((c) => c.org_id))];
  const admin  = createAdminClient();

  const { data: article } = await admin
    .from("knowledge_articles")
    .select("id, title, content, category, tags, updated_at, created_at, org_id")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (!article || !orgIds.includes(article.org_id)) notFound();

  // Reading time estimate (~200 wpm) — strip HTML before counting
  const wordCount   = article.content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back */}
      <Link
        href="/portal/knowledge-base"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Knowledge Base
      </Link>

      {/* Header */}
      <div className="space-y-3">
        {article.category && (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            {article.category}
          </p>
        )}
        <h1 className="text-2xl font-bold text-foreground leading-snug">{article.title}</h1>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {readMinutes} min read
          </span>
          <span>Updated {new Date(article.updated_at).toLocaleDateString()}</span>
        </div>
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag size={12} className="text-muted-foreground" />
            {article.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sc-card p-6 md:p-8">
        <ArticleContent content={article.content} />
      </div>

      {/* View tracker */}
      <ViewTracker articleId={article.id} />

      {/* Feedback */}
      <div className="sc-card p-5">
        <ArticleFeedback articleId={article.id} />
      </div>

      {/* Footer CTA */}
      <div className="sc-card p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">Didn&apos;t find what you need?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Our support team is here to help.</p>
        </div>
        <Link
          href="/portal/tickets/new"
          className="shrink-0 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}
