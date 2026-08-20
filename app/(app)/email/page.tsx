import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail, Send, Clock, TrendingUp, AlertCircle, Settings,
  BarChart2, Inbox, ArrowRight, Copy,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { getOrgEmail } from "@/lib/email/platform-provider";
import { getEmailStats } from "@/lib/email/analytics";
import { DeliveryStatusBadge } from "@/components/email/shared/DeliveryStatusBadge";

export const metadata: Metadata = { title: "Email | SupportCraft" };

function StatCard({ label, value, sub, icon: Icon, color = "text-primary" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  return (
    <div className="sc-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-xl bg-primary/10 ${color}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

export default async function EmailPage() {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const [stats, recentMessageRows, queueRows, emailSettings] = await Promise.all([
    getEmailStats(orgId, 30),
    prisma.emailMessage.findMany({
      where:   { organizationId: orgId },
      select:  { id: true, direction: true, fromAddress: true, toAddress: true, subject: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take:    10,
    }),
    prisma.emailQueue.findMany({
      where:   { organizationId: orgId, status: "pending" },
      select:  { id: true, toAddresses: true, subject: true, status: true, priority: true, createdAt: true },
      orderBy: { priority: "desc" },
      take:    5,
    }),
    prisma.emailSettings.findUnique({
      where:  { organizationId: orgId },
      select: { tenantSlug: true, displayName: true },
    }),
  ]);

  const recentMessages = recentMessageRows.map((m) => ({
    id: m.id, direction: m.direction, from_address: m.fromAddress, to_address: m.toAddress,
    subject: m.subject, status: m.status, created_at: m.createdAt,
  }));
  const queueItems = queueRows.map((q) => ({
    id: q.id, to_addresses: q.toAddresses, subject: q.subject, status: q.status,
    priority: q.priority, created_at: q.createdAt,
  }));

  const notConfigured  = !emailSettings?.tenantSlug;
  const supportEmail   = emailSettings?.tenantSlug ? getOrgEmail(emailSettings.tenantSlug) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Inbound &amp; outbound email management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/email/analytics"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <BarChart2 size={15} />
            Analytics
          </Link>
          <Link
            href="/settings/email"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Settings size={15} />
            Settings
          </Link>
        </div>
      </div>

      {/* Setup banner */}
      {notConfigured && (
        <div className="sc-card p-4 border-amber-500/40 bg-amber-500/5 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Email not configured</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Set a tenant slug and outbound provider to start receiving and sending emails.
            </p>
          </div>
          <Link
            href="/settings/email"
            className="shrink-0 text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
          >
            Configure <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Config summary — inbound = outbound = same address */}
      {supportEmail && (
        <div className="sc-card p-4 flex items-center gap-3">
          <Mail size={15} className="text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Inbound &amp; outbound address</p>
            <p className="text-sm font-semibold text-foreground truncate">{supportEmail}</p>
          </div>
          {emailSettings?.displayName && (
            <span className="text-xs text-muted-foreground hidden sm:block shrink-0">{emailSettings.displayName}</span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Sent (30d)"     value={stats.totalSent}     icon={Send}        />
        <StatCard label="Received (30d)" value={stats.totalReceived}  icon={Inbox}       />
        <StatCard label="Delivery Rate"  value={`${stats.deliveryRate}%`} icon={TrendingUp} color="text-green-600" />
        <StatCard label="Bounced (30d)"  value={stats.totalBounced}  icon={AlertCircle} color={stats.totalBounced > 0 ? "text-red-600" : "text-primary"} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Recent messages */}
        <div className="md:col-span-2 sc-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Messages</h2>
            <span className="text-xs text-muted-foreground">Last 10</span>
          </div>
          {(recentMessages ?? []).length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              No email messages yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(recentMessages ?? []).map(msg => (
                <div key={msg.id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    msg.direction === "outbound" ? "bg-indigo-500" : "bg-emerald-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate font-medium">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {msg.direction === "inbound" ? `From: ${msg.from_address}` : `To: ${msg.to_address}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <DeliveryStatusBadge status={msg.status} />
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Queue sidebar */}
        <div className="sc-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Queue</h2>
            <Link href="/email/analytics" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>
          {(queueItems ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              <Clock className="mx-auto mb-2 opacity-30" size={24} />
              Queue empty
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(queueItems ?? []).map(item => (
                <div key={item.id} className="px-4 py-3">
                  <p className="text-sm text-foreground truncate">{item.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{item.to_addresses[0]}</span>
                    <span className="text-xs text-muted-foreground">P:{item.priority}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
