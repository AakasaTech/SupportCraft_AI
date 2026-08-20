import type { Metadata } from "next";
import Link              from "next/link";
import { ArrowLeft, Plus, Folder } from "lucide-react";
import { requireAuth }  from "@/lib/auth/helpers";
import { prisma }       from "@/lib/prisma";
import { CategoryManagerClient } from "./CategoryManagerClient";

export const metadata: Metadata = { title: "KB Categories" };

export default async function CategoriesPage() {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const [categoryRows, counts] = await Promise.all([
    prisma.kbCategory.findMany({
      where:   { organizationId: orgId },
      select:  { id: true, name: true, slug: true, description: true, icon: true, sortOrder: true, isArchived: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    // Article count per category
    prisma.knowledgeArticle.findMany({
      where:  { organizationId: orgId, status: "published" },
      select: { categoryId: true },
    }),
  ]);

  const categories = categoryRows.map((c) => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description, icon: c.icon,
    sort_order: c.sortOrder, is_archived: c.isArchived,
  }));

  const countMap: Record<string, number> = {};
  counts.forEach((a) => {
    if (a.categoryId) countMap[a.categoryId] = (countMap[a.categoryId] ?? 0) + 1;
  });

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/knowledge-base"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft size={14} /> Knowledge Base
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Folder size={20} className="text-primary" />
            Categories
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Organize your articles into categories
          </p>
        </div>
      </div>

      <CategoryManagerClient categories={categories ?? []} countMap={countMap} />
    </div>
  );
}
