import type { Metadata }  from "next";
import Link               from "next/link";
import { ArrowLeft }      from "lucide-react";
import { requireAuth }    from "@/lib/auth/helpers";
import { prisma }         from "@/lib/prisma";
import { ArticleEditor }  from "@/features/knowledge-base/components/ArticleEditor";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage() {
  const user = await requireAuth();

  const categories = await prisma.kbCategory.findMany({
    where:   { organizationId: user.profile.organizationId, isArchived: false },
    select:  { id: true, name: true, icon: true },
    orderBy: { sortOrder: "asc" },
  });

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
        categories={categories}
        orgId={user.profile.organizationId}
      />
    </div>
  );
}
