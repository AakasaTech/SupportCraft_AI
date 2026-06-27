import { NextResponse }      from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { articleId, isHelpful, comment, customerId } =
    await request.json() as {
      articleId: string;
      isHelpful: boolean;
      comment?:  string;
      customerId?: string;
    };

  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const admin = createAdminClient();

  // Insert feedback
  const { error: feedbackError } = await admin.from("article_feedback").insert({
    article_id:  articleId,
    customer_id: customerId ?? null,
    is_helpful:  isHelpful,
    comment:     comment ?? null,
  });

  if (feedbackError) return NextResponse.json({ error: feedbackError.message }, { status: 500 });

  // Increment vote counter on article
  const column = isHelpful ? "helpful_votes" : "not_helpful_votes";
  const { data: article } = await admin
    .from("knowledge_articles")
    .select(column)
    .eq("id", articleId)
    .single();

  if (article) {
    const current = (article as Record<string, number>)[column] ?? 0;
    await admin.from("knowledge_articles")
      .update({ [column]: current + 1 })
      .eq("id", articleId);
  }

  return NextResponse.json({ success: true });
}
