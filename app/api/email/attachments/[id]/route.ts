import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/helpers";
import { downloadFile } from "@/lib/storage";

export async function GET(
  req:     NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const att = await prisma.emailAttachment.findFirst({
    where:  { id, organizationId: user.profile.organizationId },
    select: { storagePath: true, filename: true, contentType: true },
  });

  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const { buffer } = await downloadFile(att.storagePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        att.contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(att.filename)}"`,
      },
    });
  } catch (err) {
    console.error("Storage download error:", err);
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }
}
