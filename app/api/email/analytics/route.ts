import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getEmailStats, getEmailVolume } from "@/lib/email/analytics";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const [stats, volume] = await Promise.all([
    getEmailStats(profile.org_id, days),
    getEmailVolume(profile.org_id, days),
  ]);

  return NextResponse.json({ stats, volume });
}
