import { createAdminClient } from "@/lib/supabase/server";
import { Building2, Users, Ticket, Zap } from "lucide-react";

async function getStats() {
  const supabase = createAdminClient();

  const [
    { count: orgCount },
    { count: userCount },
    { count: ticketCount },
    { count: aiCount },
  ] = await Promise.all([
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("tickets").select("*", { count: "exact", head: true }),
    supabase.from("ai_usage_logs").select("*", { count: "exact", head: true }),
  ]);

  // Plan distribution
  const { data: orgs } = await supabase
    .from("organizations")
    .select("plan, freepass_plan, freepass_until");

  const planCounts = { free: 0, pro: 0, business: 0, freepass: 0 };
  for (const org of orgs ?? []) {
    const hasFreepass =
      org.freepass_plan &&
      (!org.freepass_until || new Date(org.freepass_until) > new Date());
    if (hasFreepass) {
      planCounts.freepass++;
    } else {
      planCounts[org.plan as keyof typeof planCounts]++;
    }
  }

  return {
    orgCount:    orgCount    ?? 0,
    userCount:   userCount   ?? 0,
    ticketCount: ticketCount ?? 0,
    aiCount:     aiCount     ?? 0,
    planCounts,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Organizations", value: stats.orgCount,    icon: Building2, color: "text-blue-500"   },
    { label: "Users",         value: stats.userCount,   icon: Users,     color: "text-emerald-500" },
    { label: "Tickets",       value: stats.ticketCount, icon: Ticket,    color: "text-amber-500"   },
    { label: "AI Calls",      value: stats.aiCount,     icon: Zap,       color: "text-violet-500"  },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
      <p className="text-muted-foreground mb-6">Platform overview</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className={`mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Plan distribution */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Plan Distribution</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Free",     value: stats.planCounts.free,     color: "bg-muted"        },
            { label: "Startup",  value: stats.planCounts.pro,      color: "bg-blue-500"     },
            { label: "Business", value: stats.planCounts.business, color: "bg-violet-500"   },
            { label: "Freepass", value: stats.planCounts.freepass, color: "bg-amber-500"    },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
              <div>
                <p className="text-lg font-semibold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
