import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getOrgEmail } from "@/lib/email/platform-provider";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slug = req.nextUrl.searchParams.get("slug")?.toLowerCase().trim();
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  if (!/^[a-z0-9-]{2,30}$/.test(slug)) {
    return NextResponse.json({ available: false, reason: "Lowercase letters, numbers and hyphens only (2–30 chars)" });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();

  const { data: existing } = await admin
    .from("email_settings")
    .select("org_id")
    .eq("tenant_slug", slug)
    .single();

  // Available if no row exists, or the existing row belongs to this org (renaming)
  const available = !existing || existing.org_id === profile?.org_id;

  return NextResponse.json({
    available,
    email:  available ? getOrgEmail(slug) : null,
    reason: available ? null : `"${slug}" is already taken`,
  });
}
