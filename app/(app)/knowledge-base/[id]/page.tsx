import { notFound, redirect } from "next/navigation";
import type { Metadata }      from "next";
import Link                   from "next/link";
import { ArrowLeft }          from "lucide-react";
import { createClient }       from "@/lib/supabase/server";
import { ArticleEditor }      from "@/features/knowledge-base/components/ArticleEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("knowledge_articles").select("title").eq("id", id).single();
  return { title: data?.title ?? "Article" };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const [{ data: article }, { data: categories }, { data: versions }] = await Promise.all([
    supabase
      .from("knowledge_articles")
      .select("id, title, content, excerpt, status, visibility, category, category_id, tags, seo_title, seo_description, cover_image_url, version")
      .eq("id", id)
      .single(),

    supabase
      .from("kb_categories")
      .select("id, name, icon")
      .eq("org_id", profile.org_id)
      .eq("is_archived", false)
      .order("sort_order"),

    supabase
      .from("article_versions")
      .select("id, version_number, change_summary, created_at")
      .eq("article_id", id)
      .order("version_number", { ascending: false })
      .limit(20),
  ]);

  if (!article) notFound();

  return (
    <div className="p-6 space-y-4">
      <Link
        href="/knowledge-base"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft size={14} />
        Knowledge Base
      </Link>

      <ArticleEditor
        article={{
          ...article,
          tags:       article.tags ?? [],
          visibility: article.visibility ?? "public",
          version:    article.version ?? 1,
        }}
        categories={categories ?? []}
        versions={versions ?? []}
        orgId={profile.org_id}
      />
    </div>
  );
}
