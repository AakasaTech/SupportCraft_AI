import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { uploadFile } from "@/lib/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const ext    = file.name.split(".").pop() ?? "bin";
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const key    = `tickets/${user.profile.organizationId}/${ticketId}/${unique}.${ext}`;

  try {
    const arrayBuffer = await file.arrayBuffer();
    const { url } = await uploadFile(key, new Uint8Array(arrayBuffer), file.type || "application/octet-stream");
    return NextResponse.json({ fileUrl: url, filename: file.name, fileSize: file.size });
  } catch (err) {
    console.error("Storage upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
