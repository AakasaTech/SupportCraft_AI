import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import type { EmailQueueStatus } from "@/lib/generated/prisma/client";
import { processQueue } from "@/lib/email/queue";

export const runtime = "nodejs";

/** GET — list queue items for the org */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = (req.nextUrl.searchParams.get("status") ?? "pending") as EmailQueueStatus;
  const rows = await prisma.emailQueue.findMany({
    where:   { organizationId: user.profile.organizationId, status },
    select:  { id: true, toAddresses: true, subject: true, priority: true, status: true, retryCount: true, errorMessage: true, createdAt: true, processedAt: true },
    orderBy: { createdAt: "desc" },
    take:    50,
  });

  const items = rows.map((q) => ({
    id: q.id, to_addresses: q.toAddresses, subject: q.subject, priority: q.priority,
    status: q.status, retry_count: q.retryCount, error_message: q.errorMessage,
    created_at: q.createdAt, processed_at: q.processedAt,
  }));

  return NextResponse.json({ items });
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
