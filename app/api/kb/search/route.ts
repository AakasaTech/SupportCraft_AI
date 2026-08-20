import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query, limit = 10 } = await request.json() as { query: string; limit?: number };
  if (!query?.trim()) return NextResponse.json({ articles: [] });

  const trimmed = query.trim();

  const articles = await prisma.knowledgeArticle.findMany({
    where: {
      organizationId: user.profile.organizationId,
      status: "published",
      OR: [
        { title:   { contains: trimmed, mode: "insensitive" } },
        { excerpt: { contains: trimmed, mode: "insensitive" } },
        { content: { contains: trimmed, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, excerpt: true, category: true, tags: true, readingTimeMin: true, viewsCount: true },
    take: limit,
  });

  return NextResponse.json({
    articles: articles.map((a) => ({
      id: a.id, title: a.title, excerpt: a.excerpt, category: a.category, tags: a.tags,
      reading_time_min: a.readingTimeMin, views_count: a.viewsCount,
    })),
  });
}
