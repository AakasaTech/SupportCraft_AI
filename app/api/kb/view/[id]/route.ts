import { NextResponse }      from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const admin = createAdminClient();

  const { data: article } = await admin
    .from("knowledge_articles")
    .select("views_count")
    .eq("id", id)
    .single();

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await admin.from("knowledge_articles")
    .update({ views_count: (article.views_count ?? 0) + 1 })
    .eq("id", id);

  return NextResponse.json({ success: true });
}
