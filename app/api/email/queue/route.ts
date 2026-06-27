import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { processQueue } from "@/lib/email/queue";

export const runtime = "nodejs";

/** GET — list queue items for the org */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const status = req.nextUrl.searchParams.get("status") ?? "pending";
  const { data: items } = await admin
    .from("email_queue")
    .select("id, to_addresses, subject, priority, status, retry_count, error_message, created_at, processed_at")
    .eq("org_id", profile.org_id)
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ items: items ?? [] });
}

/** POST — trigger queue processing (call from cron or admin action) */
export async function POST(req: NextRequest) {
  // Simple secret guard for cron calls
  const secret = req.headers.get("x-cron-secret");
  const envSecret = process.env.CRON_SECRET;
  if (envSecret && secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processQueue(20);
  return NextResponse.json(result);
}
