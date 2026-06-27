import { Sparkles, Building2, CalendarDays, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { PLAN_NAMES } from "@/lib/plans";
import type { OrgPlan } from "@/types/database";

interface Props {
  orgId:  string;
  userId: string;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function getDateLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month:   "long",
    day:     "numeric",
    year:    "numeric",
  });
}

export async function WelcomeBanner({ orgId, userId }: Props) {
  const supabase = await createClient();

  const todayStart  = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toISOString(); })();
  const monthStart  = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); })();

  const [
    { data: profile },
    { data: org },
    { count: aiToday },
    { count: aiMonth },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).single(),
    supabase.from("organizations").select("name, plan").eq("id", orgId).single(),
    supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", todayStart),
    supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }).eq("org_id", orgId).gte("created_at", monthStart),
  ]);

  const firstName = (profile?.full_name ?? "there").split(" ")[0];
  const orgName   = org?.name ?? "Your Organization";
  const plan      = (org?.plan ?? "free") as OrgPlan;
  const aiMonthLimit = plan === "pro" ? 1000 : plan === "business" ? Infinity : 50;
  const aiUsedToday  = aiToday  ?? 0;
  const aiUsedMonth  = aiMonth  ?? 0;

  const pct = aiMonthLimit === Infinity ? 0 : Math.min(100, Math.round((aiUsedMonth / aiMonthLimit) * 100));
  const low = pct >= 80;

  return (
    <div className="mx-6 mt-6 rounded-2xl overflow-hidden sc-gradient-primary text-white">
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        {/* Left: greeting */}
        <div>
          <p className="text-white/70 text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-2xl font-bold mt-0.5">{firstName} 👋</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} className="opacity-70" />
              {getDateLabel()}
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={13} className="opacity-70" />
              {orgName}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={13} className="opacity-70" />
              {PLAN_NAMES[plan]} plan
            </span>
          </div>
        </div>

        {/* Right: AI usage pill */}
        <div className="flex-shrink-0">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[180px]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-white/90" />
              <span className="text-xs font-semibold text-white/90">AI Usage</span>
            </div>
            <div className="text-lg font-bold">
              {aiUsedToday} <span className="text-sm font-normal text-white/60">req today</span>
            </div>
            {aiMonthLimit !== Infinity && (
              <>
                <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", low ? "bg-amber-300" : "bg-white/80")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-white/60">
                  {aiUsedMonth} / {aiMonthLimit} monthly
                </p>
              </>
            )}
            {aiMonthLimit === Infinity && (
              <p className="text-[10px] text-white/60 mt-1">Unlimited (Business)</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
