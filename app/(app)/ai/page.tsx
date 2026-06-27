import type { Metadata } from "next";
import { Sparkles, Zap, DollarSign, Clock, TrendingUp, Database } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { getMonthlyStats } from "@/lib/ai/usage";
import { canUseAI } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { OrgPlan } from "@/types/database";

export const metadata: Metadata = { title: "AI Platform" };

const FEATURE_LABELS: Record<string, string> = {
  reply:      "Reply Generation",
  improve:    "Reply Improvement",
  summarize:  "Summarization",
  classify:   "Classification",
  sentiment:  "Sentiment",
  suggest:    "Suggestions",
  categorize: "Auto-Categorize",
};

const FEATURE_COLORS: Record<string, string> = {
  reply:      "bg-ai text-white",
  improve:    "bg-purple-500 text-white",
  summarize:  "bg-blue-500 text-white",
  classify:   "bg-amber-500 text-white",
  sentiment:  "bg-green-500 text-white",
  suggest:    "bg-ai text-white",
  categorize: "bg-amber-500 text-white",
};

const PLAN_LIMITS: Record<string, number> = {
  free:     50,
  pro:      500,
  business: 5000,
};

function formatCost(usd: number | null): string {
  if (!usd) return "$0.00";
  return `$${usd.toFixed(4)}`;
}

export default async function AIPlatformPage() {
  const { profile } = await requireAuth();

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, plan")
    .eq("id", profile.org_id)
    .single();

  const logs = await getMonthlyStats(profile.org_id);

  const totalCalls     = logs.length;
  const totalTokens    = logs.reduce((s, l) => s + (l.tokens_used    ?? 0), 0);
  const totalCost      = logs.reduce((s, l) => s + (l.estimated_cost_usd ?? 0), 0);
  const avgLatency     = logs.length
    ? Math.round(logs.reduce((s, l) => s + (l.latency_ms ?? 0), 0) / logs.length)
    : 0;
  const cacheHits      = logs.filter((l) => l.cached).length;
  const cacheRate      = totalCalls > 0 ? Math.round((cacheHits / totalCalls) * 100) : 0;

  const plan       = (org?.plan ?? "free") as OrgPlan;
  const limit      = PLAN_LIMITS[plan] ?? 50;
  const pct        = Math.min(100, Math.round((totalCalls / limit) * 100));
  const allowed    = canUseAI(plan, totalCalls);

  // Feature breakdown
  const byFeature = logs.reduce<Record<string, { calls: number; tokens: number; cost: number }>>(
    (acc, l) => {
      const key = l.feature ?? "unknown";
      if (!acc[key]) acc[key] = { calls: 0, tokens: 0, cost: 0 };
      acc[key].calls++;
      acc[key].tokens += l.tokens_used ?? 0;
      acc[key].cost   += l.estimated_cost_usd ?? 0;
      return acc;
    },
    {}
  );

  // Daily breakdown (last 7 days)
  const now = new Date();
  const days: { label: string; calls: number }[] = Array.from({ length: 7 }, (_, i) => {
    const d    = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const key  = d.toISOString().slice(0, 10);
    const calls = logs.filter((l) => l.created_at?.startsWith(key)).length;
    return { label: d.toLocaleDateString([], { weekday: "short" }), calls };
  });
  const maxCalls = Math.max(1, ...days.map((d) => d.calls));

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-ai-subtle">
          <Sparkles size={20} className="text-ai" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">AI Platform</h1>
          <p className="text-sm text-muted-foreground">
            Usage, costs, and feature analytics for {org?.name ?? "your organization"}
          </p>
        </div>
      </div>

      {/* Usage limit banner */}
      {!allowed && (
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 flex items-center gap-3">
          <Zap size={16} className="text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            Monthly AI limit reached ({totalCalls}/{limit} calls). Upgrade your plan to continue.
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Calls",   value: totalCalls.toLocaleString(),    icon: Zap,        color: "text-ai"         },
          { label: "Tokens Used",   value: totalTokens.toLocaleString(),   icon: Database,   color: "text-blue-500"   },
          { label: "Est. Cost",     value: formatCost(totalCost),          icon: DollarSign, color: "text-green-600"  },
          { label: "Avg Latency",   value: `${avgLatency}ms`,              icon: Clock,      color: "text-amber-500"  },
          { label: "Cache Rate",    value: `${cacheRate}%`,                icon: TrendingUp, color: "text-purple-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="sc-card p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Icon size={13} className={color} />
              <p className="text-[11px] text-muted-foreground font-medium">{label}</p>
            </div>
            <p className="text-xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {/* Plan usage bar */}
      <div className="sc-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-foreground capitalize">{plan} Plan</span>
          <span className="text-muted-foreground">{totalCalls} / {limit} calls this month</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-ai"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">{pct}% used &mdash; resets on the 1st of next month</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Feature breakdown */}
        <div className="sc-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Feature Breakdown</h2>
          {Object.keys(byFeature).length === 0 && (
            <p className="text-sm text-muted-foreground">No AI calls this month yet.</p>
          )}
          <div className="space-y-2">
            {Object.entries(byFeature)
              .sort((a, b) => b[1].calls - a[1].calls)
              .map(([feature, stats]) => (
                <div key={feature} className="flex items-center gap-3">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                    FEATURE_COLORS[feature] ?? "bg-muted text-muted-foreground"
                  )}>
                    {FEATURE_LABELS[feature] ?? feature}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-ai"
                        style={{ width: `${totalCalls > 0 ? Math.round((stats.calls / totalCalls) * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 w-12 text-right">
                    {stats.calls} calls
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Daily activity chart */}
        <div className="sc-card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Last 7 Days</h2>
          <div className="flex items-end gap-1.5 h-24">
            {days.map(({ label, calls }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className="w-full rounded-t-sm bg-ai/70 transition-all"
                    style={{ height: `${Math.round((calls / maxCalls) * 80)}px`, minHeight: calls > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent calls log */}
      <div className="sc-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent AI Calls</h2>
        </div>
        <div className="divide-y divide-border">
          {logs.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No calls this month.</p>
          )}
          {logs.slice(0, 20).map((log, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-hover/50 transition-colors">
              <span className={cn(
                "text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0",
                FEATURE_COLORS[log.feature] ?? "bg-muted text-muted-foreground"
              )}>
                {FEATURE_LABELS[log.feature] ?? log.feature}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">{log.provider}/{log.model ?? "—"}</span>
              <span className="text-xs text-muted-foreground shrink-0">{log.tokens_used ?? 0} tok</span>
              <span className="text-xs text-muted-foreground shrink-0">{log.latency_ms ?? "—"}ms</span>
              <span className="text-xs text-muted-foreground shrink-0">{formatCost(log.estimated_cost_usd)}</span>
              {log.cached && (
                <span className="text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded font-medium shrink-0">cached</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto shrink-0">
                {log.created_at ? new Date(log.created_at).toLocaleTimeString([], { timeStyle: "short" }) : ""}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
