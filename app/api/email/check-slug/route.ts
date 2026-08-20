import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { getOrgEmail } from "@/lib/email/platform-provider";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  if (!/^[a-z0-9-]{2,30}$/.test(slug)) {
    return NextResponse.json({ available: false, reason: "Lowercase letters, numbers and hyphens only (2–30 chars)" });
  }

  const existing = await prisma.emailSettings.findUnique({
    where:  { tenantSlug: slug },
    select: { organizationId: true },
  });

  // Available if no row exists, or the existing row belongs to this org (renaming)
  const available = !existing || existing.organizationId === user.profile.organizationId;

  return NextResponse.json({
    available,
    email:  available ? getOrgEmail(slug) : null,
    reason: available ? null : `"${slug}" is already taken`,
  });
}
