import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(
  req:     NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch attachment record (org-scoped)
  const { data: att } = await admin
    .from("email_attachments")
    .select("storage_path, filename, content_type, org_id")
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .single();

  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Download from storage
  const { data, error } = await admin.storage
    .from("email-attachments")
    .download(att.storage_path);

  if (error || !data) return NextResponse.json({ error: "Storage error" }, { status: 500 });

  const buffer = await data.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":        att.content_type,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(att.filename)}"`,
    },
  });
}
