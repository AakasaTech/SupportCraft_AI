import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INBOUND_SECRET = process.env.INBOUND_SECRET ?? "";

export const runtime = "nodejs";

// GET /api/email/resolve-tenant?slug=acme — called by the inbound Cloudflare
// Worker to resolve a recipient's tenant slug to an org id before deciding
// whether to accept or reject the SMTP message. Replaces the Worker's old
// direct Supabase REST lookup against email_settings.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization");
  if (!auth || auth !== `Bearer ${INBOUND_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const settings = await prisma.emailSettings.findUnique({
    where:  { tenantSlug: slug },
    select: { organizationId: true },
  });

  if (!settings) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ orgId: settings.organizationId });
}
