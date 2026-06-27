import { ExternalLink, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getTeamPerformance } from "@/lib/dashboard/queries";

interface Props {
  orgId: string;
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 90 ? "text-success bg-success-subtle" :
    score >= 75 ? "text-primary bg-primary-subtle" :
    score > 0   ? "text-warning-foreground bg-warning-subtle" :
                  "text-muted-foreground bg-muted";
  return (
    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums", cls)}>
      {score > 0 ? `${score}%` : "—"}
    </span>
  );
}

export async function TeamPerformanceWidget({ orgId }: Props) {
  const members = await getTeamPerformance(orgId);

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award size={15} className="text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Team Performance</h3>
            <p className="text-xs text-muted-foreground mt-0.5">This month</p>
          </div>
        </div>
        <Link
          href="/settings/team"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Manage <ExternalLink size={11} />
        </Link>
      </div>

      {!members.length ? (
        <div className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No team members found. Invite agents to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-2.5 text-left text-xs font-medium text-muted-foreground">Agent</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Open</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Resolved</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground">Avg Reply</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium text-muted-foreground">CSAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m, idx) => (
                <tr key={m.userId} className="hover:bg-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {/* Rank medal for top 3 */}
                      {idx === 0 && <span className="text-sm" title="Top performer">🥇</span>}
                      {idx === 1 && <span className="text-sm" title="Second place">🥈</span>}
                      {idx === 2 && <span className="text-sm" title="Third place">🥉</span>}
                      {idx > 2  && <span className="w-5" />}
                      <div className="w-7 h-7 rounded-full bg-primary-subtle flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {m.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate max-w-[120px]">{m.fullName}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{m.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    <span className={cn(
                      "text-sm font-medium",
                      m.openTickets > 10 ? "text-destructive" : m.openTickets > 5 ? "text-warning-foreground" : ""
                    )}>
                      {m.openTickets}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-sm font-medium text-success">
                    {m.resolvedThisMonth}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-[11px] text-muted-foreground flex items-center justify-end gap-1">
                      <TrendingUp size={10} />
                      {m.avgReplyMinutes > 0 ? `${Math.round(m.avgReplyMinutes)}m` : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <ScoreBadge score={m.csatScore} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
