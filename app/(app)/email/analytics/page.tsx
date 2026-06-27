import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingUp, Send, Inbox, AlertCircle, MousePointerClick } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getEmailStats, getEmailVolume } from "@/lib/email/analytics";

export const metadata: Metadata = { title: "Email Analytics | SupportCraft" };

export default async function EmailAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const [stats, volume, { data: topSenders }] = await Promise.all([
    getEmailStats(profile.org_id, 30),
    getEmailVolume(profile.org_id, 30),
    admin
      .from("email_messages")
      .select("from_address")
      .eq("org_id", profile.org_id)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  // Top senders
  const senderCounts: Record<string, number> = {};
  for (const m of topSenders ?? []) {
    senderCounts[m.from_address] = (senderCounts[m.from_address] ?? 0) + 1;
  }
  const topSenderList = Object.entries(senderCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxVolume = Math.max(...volume.map(v => v.sent + v.received), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/email"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Email
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Sent",          value: stats.totalSent,             icon: Send,              color: "text-indigo-600" },
          { label: "Received",      value: stats.totalReceived,          icon: Inbox,             color: "text-emerald-600" },
          { label: "Delivery Rate", value: `${stats.deliveryRate}%`,     icon: TrendingUp,        color: "text-green-600" },
          { label: "Open Rate",     value: `${stats.openRate}%`,         icon: MousePointerClick, color: "text-primary" },
          { label: "Reply Rate",    value: `${stats.replyRate}%`,        icon: TrendingUp,        color: "text-blue-600" },
          { label: "Bounced",       value: stats.totalBounced,           icon: AlertCircle,       color: stats.totalBounced > 0 ? "text-red-600" : "text-muted-foreground" },
        ].map(stat => (
          <div key={stat.label} className="sc-card p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <stat.icon size={18} className={`${stat.color} opacity-60 mt-1`} />
            </div>
          </div>
        ))}
      </div>

      {/* Volume chart */}
      <div className="sc-card p-5">
        <h2 className="font-semibold text-foreground mb-4">Volume — Last 30 Days</h2>
        {volume.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-2">
            {volume.slice(-14).map(day => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {new Date(day.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
                <div className="flex-1 flex gap-1 h-5">
                  {day.sent > 0 && (
                    <div
                      className="bg-indigo-500/80 rounded-sm"
                      style={{ width: `${(day.sent / maxVolume) * 100}%` }}
                      title={`${day.sent} sent`}
                    />
                  )}
                  {day.received > 0 && (
                    <div
                      className="bg-emerald-500/80 rounded-sm"
                      style={{ width: `${(day.received / maxVolume) * 100}%` }}
                      title={`${day.received} received`}
                    />
                  )}
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                  ↑{day.sent} ↓{day.received}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-2 rounded-sm bg-indigo-500/80 inline-block" /> Sent
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-2 rounded-sm bg-emerald-500/80 inline-block" /> Received
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top senders */}
      <div className="sc-card">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Most Active Senders</h2>
        </div>
        {topSenderList.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No inbound emails yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {topSenderList.map(([email, count]) => (
              <div key={email} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-foreground truncate">{email}</span>
                <span className="text-sm font-semibold text-primary shrink-0 ml-4">{count} emails</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
