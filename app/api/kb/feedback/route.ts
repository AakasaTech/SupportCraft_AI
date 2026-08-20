import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { articleId, isHelpful, comment, customerId } =
    await request.json() as {
      articleId: string;
      isHelpful: boolean;
      comment?:  string;
      customerId?: string;
    };

  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  try {
    await prisma.articleFeedback.create({
      data: {
        articleId,
        customerId: customerId ?? null,
        isHelpful,
        comment: comment ?? null,
      },
    });

    // Increment vote counter on article — updateMany so a missing article
    // (edge case) just no-ops instead of throwing, matching the original
    // "best effort" behavior; the feedback row above is already saved either way.
    await prisma.knowledgeArticle.updateMany({
      where: { id: articleId },
      data: isHelpful
        ? { helpfulVotes: { increment: 1 } }
        : { notHelpfulVotes: { increment: 1 } },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to record feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
