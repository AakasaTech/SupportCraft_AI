import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { query, orgIds } = (await req.json()) as { query?: string; orgIds?: string[] };

    if (!query || query.trim().length < 2 || !orgIds?.length) {
      return NextResponse.json({ articles: [] });
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from("knowledge_articles")
      .select("id, title, category")
      .in("org_id", orgIds)
      .eq("status", "published")
      .or(`title.ilike.%${query.trim()}%,content.ilike.%${query.trim()}%`)
      .limit(4);

    return NextResponse.json({ articles: data ?? [] });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
