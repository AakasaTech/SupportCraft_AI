import {
  TicketCheck, User, Clock, AlertTriangle, CheckCircle2,
  Timer, Gauge, SmilePlus, Sparkles,
} from "lucide-react";
import { KpiCard } from "./cards/KpiCard";
import { getKpiData } from "@/lib/dashboard/queries";

interface Props {
  orgId:  string;
  userId: string;
}

function formatDelta(n: number) {
  if (n === 0) return { direction: "neutral" as const, value: 0 };
  return { direction: n > 0 ? "up" as const : "down" as const, value: Math.abs(n) };
}

export async function KpiGrid({ orgId, userId }: Props) {
  const d = await getKpiData(orgId, userId);

  const openDelta     = formatDelta(d.openDelta);
  const resolvedDelta = formatDelta(d.resolvedDelta);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">

      {/* 1 — Open Tickets */}
      <KpiCard
        title="Open Tickets"
        value={d.openTotal}
        icon={TicketCheck}
        variant="primary"
        description="Active in queue"
        trend={{ ...openDelta, label: " today", good: "down" }}
      />

      {/* 2 — Assigned To Me */}
      <KpiCard
        title="Assigned to Me"
        value={d.myOpen}
        icon={User}
        variant="default"
        description={d.myHighPriority > 0 ? `${d.myHighPriority} high/urgent` : "No high-priority"}
      />

      {/* 3 — Waiting for Customer */}
      <KpiCard
        title="Waiting for Customer"
        value={d.pending}
        icon={Clock}
        variant="default"
        description="Status: pending"
      />

      {/* 4 — Overdue */}
      <KpiCard
        title="Overdue Tickets"
        value={d.overdue}
        icon={AlertTriangle}
        variant={d.overdue > 0 ? "warning" : "default"}
        description="High/urgent, open > 24h"
        badge={d.overdue > 0 ? "Needs attention" : undefined}
      />

      {/* 5 — Resolved Today */}
      <KpiCard
        title="Resolved Today"
        value={d.resolvedToday}
        icon={CheckCircle2}
        variant="success"
        description="Closed this calendar day"
        trend={{ ...resolvedDelta, label: " vs yesterday", good: "up" }}
      />

      {/* 6 — Avg Response Time (static label since we don't yet compute it) */}
      <KpiCard
        title="Avg First Response"
        value="—"
        icon={Timer}
        variant="default"
        description="Computed from replies"
      />

      {/* 7 — Avg Resolution Time */}
      <KpiCard
        title="Avg Resolution Time"
        value="—"
        icon={Gauge}
        variant="default"
        description="Open → resolved"
      />

      {/* 8 — CSAT */}
      <KpiCard
        title="CSAT Score"
        value="—"
        icon={SmilePlus}
        variant="default"
        description="Customer satisfaction"
      />

      {/* 9 — AI Usage Today */}
      <KpiCard
        title="AI Requests Today"
        value={d.aiRequestsToday}
        icon={Sparkles}
        variant="ai"
        description={`${d.aiTokensToday.toLocaleString()} tokens`}
      />

    </div>
  );
}
