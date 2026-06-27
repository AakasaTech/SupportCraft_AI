import type { Metadata }  from "next";
import { redirect }       from "next/navigation";
import Link               from "next/link";
import { ArrowLeft }      from "lucide-react";
import { createClient }   from "@/lib/supabase/server";
import { ArticleEditor }  from "@/features/knowledge-base/components/ArticleEditor";

export const metadata: Metadata = { title: "New Article" };

export default async function NewArticlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: categories } = await supabase
    .from("kb_categories")
    .select("id, name, icon")
    .eq("org_id", profile.org_id)
    .eq("is_archived", false)
    .order("sort_order");

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
        categories={categories ?? []}
        orgId={profile.org_id}
      />
    </div>
  );
}
