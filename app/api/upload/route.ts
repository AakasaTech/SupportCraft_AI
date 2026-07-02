import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const BUCKET = "ticket-attachments";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file     = formData.get("file") as File | null;
  const ticketId = formData.get("ticketId") as string | null;

  if (!file || !ticketId) {
    return NextResponse.json({ error: "Missing file or ticketId" }, { status: 400 });
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 413 });
  }

  const ext      = file.name.split(".").pop() ?? "bin";
  const unique   = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const filePath = `${profile.org_id}/${ticketId}/${unique}.${ext}`;

  const admin = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType:  file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert:       false,
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filePath);

  return NextResponse.json({ fileUrl: publicUrl, filename: file.name, fileSize: file.size });
}
