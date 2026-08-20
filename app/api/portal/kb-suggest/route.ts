import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { query, orgIds } = (await req.json()) as { query?: string; orgIds?: string[] };

    if (!query || query.trim().length < 2 || !orgIds?.length) {
      return NextResponse.json({ articles: [] });
    }

    const trimmed = query.trim();
    const articles = await prisma.knowledgeArticle.findMany({
      where: {
        organizationId: { in: orgIds },
        status: "published",
        OR: [
          { title:   { contains: trimmed, mode: "insensitive" } },
          { content: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, category: true },
      take: 4,
    });

    return NextResponse.json({ articles });
  } catch {
    return NextResponse.json({ articles: [] });
  }
}
