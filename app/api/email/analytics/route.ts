import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { getEmailStats, getEmailVolume } from "@/lib/email/analytics";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
  const [stats, volume] = await Promise.all([
    getEmailStats(user.profile.organizationId, days),
    getEmailVolume(user.profile.organizationId, days),
  ]);

  return NextResponse.json({ stats, volume });
}
