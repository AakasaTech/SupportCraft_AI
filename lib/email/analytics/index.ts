import { prisma } from "@/lib/prisma";
import type { EmailStats } from "../types";

export async function getEmailStats(orgId: string, days = 30): Promise<EmailStats> {
  const since = new Date(Date.now() - days * 86_400_000);

  const [totalSent, totalReceived, totalBounced, deliveryEvents] = await Promise.all([
    prisma.emailMessage.count({ where: { organizationId: orgId, direction: "outbound", createdAt: { gte: since } } }),

    prisma.emailMessage.count({ where: { organizationId: orgId, direction: "inbound", createdAt: { gte: since } } }),

    prisma.emailMessage.count({ where: { organizationId: orgId, status: "bounced", createdAt: { gte: since } } }),

    prisma.emailDeliveryEvent.findMany({
      where:  { eventType: { in: ["sent", "delivered", "opened", "bounced"] }, createdAt: { gte: since } },
      select: { eventType: true },
    }),
  ]);

  const eventCounts = deliveryEvents.reduce<Record<string, number>>(
    (acc, e) => { acc[e.eventType] = (acc[e.eventType] ?? 0) + 1; return acc; },
    {}
  );

  const delivered = eventCounts["delivered"] ?? 0;
  const opened    = eventCounts["opened"]    ?? 0;

  return {
    totalSent,
    totalReceived,
    totalBounced,
    deliveryRate:        totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0,
    openRate:            delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    replyRate:           totalSent > 0 ? Math.round((totalReceived / totalSent) * 100) : 0,
    avgFirstResponseMs:  0, // computed separately if needed
  };
}

export async function getEmailVolume(orgId: string, days = 30) {
  const since = new Date(Date.now() - days * 86_400_000);

  const rows = await prisma.emailMessage.findMany({
    where:   { organizationId: orgId, createdAt: { gte: since } },
    select:  { direction: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const buckets: Record<string, { sent: number; received: number }> = {};
  for (const row of rows) {
    const day = row.createdAt.toISOString().slice(0, 10);
    if (!buckets[day]) buckets[day] = { sent: 0, received: 0 };
    if (row.direction === "outbound") buckets[day].sent++;
    else                              buckets[day].received++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}
