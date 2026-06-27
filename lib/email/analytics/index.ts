import { createAdminClient } from "@/lib/supabase/server";
import type { EmailStats } from "../types";

export async function getEmailStats(orgId: string, days = 30): Promise<EmailStats> {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const [
    { count: totalSent },
    { count: totalReceived },
    { count: totalBounced },
    { data: deliveryEvents },
  ] = await Promise.all([
    admin.from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("direction", "outbound")
      .gte("created_at", since),

    admin.from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("direction", "inbound")
      .gte("created_at", since),

    admin.from("email_messages")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "bounced")
      .gte("created_at", since),

    admin.from("email_delivery_events")
      .select("event_type, email_message_id")
      .in("event_type", ["sent", "delivered", "opened", "bounced"])
      .gte("created_at", since),
  ]);

  const eventCounts = (deliveryEvents ?? []).reduce<Record<string, number>>(
    (acc, e) => { acc[e.event_type] = (acc[e.event_type] ?? 0) + 1; return acc; },
    {}
  );

  const sent      = totalSent      ?? 0;
  const received  = totalReceived  ?? 0;
  const bounced   = totalBounced   ?? 0;
  const delivered = eventCounts["delivered"] ?? 0;
  const opened    = eventCounts["opened"]    ?? 0;

  return {
    totalSent:           sent,
    totalReceived:       received,
    totalBounced:        bounced,
    deliveryRate:        sent > 0 ? Math.round((delivered / sent) * 100) : 0,
    openRate:            delivered > 0 ? Math.round((opened / delivered) * 100) : 0,
    replyRate:           sent > 0 ? Math.round((received / sent) * 100) : 0,
    avgFirstResponseMs:  0, // computed separately if needed
  };
}

export async function getEmailVolume(orgId: string, days = 30) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data } = await admin
    .from("email_messages")
    .select("direction, created_at")
    .eq("org_id", orgId)
    .gte("created_at", since)
    .order("created_at");

  // Group by day
  const buckets: Record<string, { sent: number; received: number }> = {};
  for (const row of data ?? []) {
    const day = row.created_at.slice(0, 10);
    if (!buckets[day]) buckets[day] = { sent: 0, received: 0 };
    if (row.direction === "outbound") buckets[day].sent++;
    else                              buckets[day].received++;
  }

  return Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));
}
