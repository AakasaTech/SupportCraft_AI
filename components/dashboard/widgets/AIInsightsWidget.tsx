import type { ElementType } from "react";
import { Bot, Lightbulb, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import { getKpiData } from "@/lib/dashboard/queries";

interface Props {
  orgId:  string;
  userId: string;
}

interface Insight {
  icon: ElementType;
  iconCls: string;
  title: string;
  description: string;
}

function buildInsights(kpi: Awaited<ReturnType<typeof getKpiData>>): Insight[] {
  const insights: Insight[] = [];

  if (kpi.avgResolutionHours > 0) {
    const hrs = kpi.avgResolutionHours;
    insights.push({
      icon: Clock,
      iconCls: hrs > 24 ? "text-destructive bg-destructive-subtle" : "text-success bg-success-subtle",
      title: hrs > 24
        ? `Avg resolution is ${hrs.toFixed(1)}h — above target`
        : `Avg resolution ${hrs.toFixed(1)}h — on track`,
      description: hrs > 24
        ? "Consider auto-assigning high-priority tickets to reduce wait times."
        : "Your team is resolving tickets within the target window. Keep it up!",
    });
  }

  if (kpi.aiSuggestionCount > 0) {
    insights.push({
      icon: Bot,
      iconCls: "text-ai bg-ai-subtle",
      title: `AI drafted ${kpi.aiSuggestionCount} replies today`,
      description: `Estimated ${kpi.aiTimeSavedHours.toFixed(1)}h saved. Enable auto-suggest on new tickets to save more.`,
    });
  }

  if (kpi.slaBreachedCount > 0) {
    insights.push({
      icon: AlertTriangle,
      iconCls: "text-destructive bg-destructive-subtle",
      title: `${kpi.slaBreachedCount} tickets breached SLA`,
      description: "Review tickets older than 48h and reach out to affected customers.",
    });
  }

  if (kpi.csatScore >= 90) {
    insights.push({
      icon: TrendingUp,
      iconCls: "text-success bg-success-subtle",
      title: `CSAT at ${kpi.csatScore}% — excellent!`,
      description: "Customers are happy. Share what's working with your whole team.",
    });
  } else if (kpi.csatScore > 0 && kpi.csatScore < 75) {
    insights.push({
      icon: TrendingUp,
      iconCls: "text-warning-foreground bg-warning-subtle",
      title: `CSAT at ${kpi.csatScore}% — needs attention`,
      description: "Review recent low-rated tickets to find patterns in negative feedback.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      iconCls: "text-ai bg-ai-subtle",
      title: "AI insights will appear here",
      description: "As your team handles tickets, AI will surface actionable observations.",
    });
  }

  return insights.slice(0, 4);
}

export async function AIInsightsWidget({ orgId, userId }: Props) {
  const kpi = await getKpiData(orgId, userId);
  const insights = buildInsights(kpi);

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ai-subtle">
            <Bot size={14} className="text-ai" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Powered by SupportCraft AI</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {insights.map((ins, i) => (
          <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className={`p-1.5 rounded-lg shrink-0 ${ins.iconCls}`}>
              <ins.icon size={13} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-snug">{ins.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{ins.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
