import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { downloadFile } from "@/lib/storage";

export async function GET(
  req:     NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();

  // Fetch attachment record (org-scoped) — still read from the Supabase
  // Postgres this table's writes go to; see attachment-processor.ts.
  const { data: att } = await admin
    .from("email_attachments")
    .select("storage_path, filename, content_type, org_id")
    .eq("id", id)
    .eq("org_id", user.profile.organizationId)
    .single();

  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { buffer } = await downloadFile(att.storage_path);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        att.content_type,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(att.filename)}"`,
      },
    });
  } catch (err) {
    console.error("Storage download error:", err);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
