import type { Metadata } from "next";
import { redirect }      from "next/navigation";
import Link              from "next/link";
import { ArrowLeft, Plus, Folder } from "lucide-react";
import { createClient }  from "@/lib/supabase/server";
import { CategoryManagerClient } from "./CategoryManagerClient";

export const metadata: Metadata = { title: "KB Categories" };

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: categories } = await supabase
    .from("kb_categories")
    .select("id, name, slug, description, icon, sort_order, is_archived")
    .eq("org_id", profile.org_id)
    .order("sort_order")
    .order("name");

  // Article count per category
  const { data: counts } = await supabase
    .from("knowledge_articles")
    .select("category_id")
    .eq("org_id", profile.org_id)
    .eq("status", "published");

  const countMap: Record<string, number> = {};
  (counts ?? []).forEach((a) => {
    if (a.category_id) countMap[a.category_id] = (countMap[a.category_id] ?? 0) + 1;
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
