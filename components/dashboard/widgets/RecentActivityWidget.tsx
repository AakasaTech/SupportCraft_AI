import type { ElementType } from "react";
import Link from "next/link";
import { ExternalLink, MessageSquare, Plus, UserCheck, RefreshCw, BookOpen, Bot } from "lucide-react";
import { getRecentActivity } from "@/lib/dashboard/queries";
import type { ActivityItem } from "@/lib/dashboard/queries";

interface Props {
  orgId: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const map: Record<ActivityItem["type"], { Icon: ElementType; cls: string }> = {
    ticket_created:  { Icon: Plus,        cls: "bg-primary-subtle text-primary" },
    ticket_resolved: { Icon: RefreshCw,   cls: "bg-success-subtle text-success" },
    ticket_replied:  { Icon: MessageSquare, cls: "bg-primary-subtle text-primary" },
    ticket_assigned: { Icon: UserCheck,   cls: "bg-warning-subtle text-warning-foreground" },
    ai_suggestion:   { Icon: Bot,         cls: "bg-ai-subtle text-ai" },
    article_published: { Icon: BookOpen,  cls: "bg-success-subtle text-success" },
  };
  const { Icon, cls } = map[type] ?? { Icon: Plus, cls: "bg-muted text-muted-foreground" };
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${cls}`}>
      <Icon size={13} />
    </div>
  );
}

export async function RecentActivityWidget({ orgId }: Props) {
  const activities = await getRecentActivity(orgId);

  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Recent Activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Last 20 events across your team</p>
        </div>
        <Link
          href="/tickets"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          All tickets <ExternalLink size={11} />
        </Link>
      </div>

      {!activities.length ? (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">No activity yet. Create your first ticket!</p>
        </div>
      ) : (
        <ol className="relative border-l border-border ml-8 mr-4 my-4 space-y-0">
          {activities.map((a, i) => (
            <li key={a.id} className={`relative pb-5 pl-6 ${i === activities.length - 1 ? "" : ""}`}>
              {/* Icon dot on timeline */}
              <span className="absolute -left-3.5 top-0">
                <ActivityIcon type={a.type} />
              </span>

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm leading-snug">
                    <span className="font-medium">{a.actorName}</span>{" "}
                    <span className="text-muted-foreground">{a.description}</span>
                    {a.ticketId && (
                      <>
                        {" "}
                        <Link
                          href={`/tickets/${a.ticketId}`}
                          className="text-primary hover:underline font-medium truncate"
                        >
                          {a.ticketTitle}
                        </Link>
                      </>
                    )}
                  </p>
                </div>
                <time className="text-[11px] text-muted-foreground whitespace-nowrap pt-0.5">
                  {timeAgo(a.createdAt)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
