import { NextResponse }      from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { createClient }      from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, limit = 10 } = await request.json() as { query: string; limit?: number };
  if (!query?.trim()) return NextResponse.json({ articles: [] });

  const admin = createAdminClient();

  // Full-text search using the generated `fts` column, fall back to ilike
  const { data: ftsResults } = await admin
    .from("knowledge_articles")
    .select("id, title, excerpt, category, tags, reading_time_min, views_count")
    .eq("org_id", profile.org_id)
    .eq("status", "published")
    .textSearch("fts", query.trim().split(/\s+/).join(" & "), { type: "plain" })
    .limit(limit);

  if (ftsResults && ftsResults.length > 0) {
    return NextResponse.json({ articles: ftsResults, source: "fts" });
  }

  // Fallback: ilike search
  const { data: ilikeResults } = await admin
    .from("knowledge_articles")
    .select("id, title, excerpt, category, tags, reading_time_min, views_count")
    .eq("org_id", profile.org_id)
    .eq("status", "published")
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .limit(limit);

  return NextResponse.json({ articles: ilikeResults ?? [], source: "ilike" });
}
