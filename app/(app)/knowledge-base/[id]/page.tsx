import { notFound } from "next/navigation";
import type { Metadata }      from "next";
import Link                   from "next/link";
import { ArrowLeft }          from "lucide-react";
import { requireAuth }        from "@/lib/auth/helpers";
import { prisma }             from "@/lib/prisma";
import { ArticleEditor }      from "@/features/knowledge-base/components/ArticleEditor";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await prisma.knowledgeArticle.findUnique({ where: { id }, select: { title: true } });
  return { title: article?.title ?? "Article" };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const [articleRow, categories, versionRows] = await Promise.all([
    // Scoped to this agent's org — Prisma has no RLS, so this check is what
    // stops one org's agent from viewing another org's article by URL id.
    prisma.knowledgeArticle.findFirst({
      where:  { id, organizationId: orgId },
      select: {
        id: true, title: true, content: true, excerpt: true, status: true, visibility: true,
        category: true, categoryId: true, tags: true, seoTitle: true, seoDescription: true,
        coverImageUrl: true, version: true,
      },
    }),

    prisma.kbCategory.findMany({
      where:   { organizationId: orgId, isArchived: false },
      select:  { id: true, name: true, icon: true },
      orderBy: { sortOrder: "asc" },
    }),

    prisma.articleVersion.findMany({
      where:   { articleId: id },
      select:  { id: true, versionNumber: true, changeSummary: true, createdAt: true },
      orderBy: { versionNumber: "desc" },
      take:    20,
    }),
  ]);

  if (!articleRow) notFound();

  const versions = versionRows.map((v) => ({
    id: v.id, version_number: v.versionNumber, change_summary: v.changeSummary,
    created_at: v.createdAt.toISOString(),
  }));

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
          id: articleRow.id, title: articleRow.title, content: articleRow.content,
          excerpt: articleRow.excerpt, status: articleRow.status, visibility: articleRow.visibility,
          category: articleRow.category, category_id: articleRow.categoryId, tags: articleRow.tags,
          seo_title: articleRow.seoTitle, seo_description: articleRow.seoDescription,
          cover_image_url: articleRow.coverImageUrl, version: articleRow.version,
        }}
        categories={categories}
        versions={versions}
        orgId={orgId}
      />
    </div>
  );
}
