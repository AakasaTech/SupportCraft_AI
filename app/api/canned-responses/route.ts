import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });

  // Org-specific non-system templates serve as canned responses
  const rows = await prisma.emailTemplate.findMany({
    where: {
      organizationId: user.profile.organizationId,
      isSystem: false,
      isActive: true,
      slug: { not: "ticket-acknowledgement" },
    },
    select: { id: true, name: true, bodyHtml: true, slug: true },
    orderBy: { name: "asc" },
  });

  const responses = rows.map(t => ({
    id:       t.id,
    title:    t.name,
    body:     t.bodyHtml,
    shortcut: t.slug?.startsWith("canned-") ? `/${t.slug.replace("canned-", "")}` : undefined,
  }));

  return NextResponse.json(responses);
}
