import type { Metadata } from "next";
import { redirect }      from "next/navigation";
import Link              from "next/link";
import {
  ArrowLeft, Eye, ThumbsUp, ThumbsDown, BookOpen, TrendingUp, Star,
} from "lucide-react";
import { createClient }  from "@/lib/supabase/server";

export const metadata: Metadata = { title: "KB Analytics" };

export default async function KBAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: articles } = await supabase
    .from("knowledge_articles")
    .select("id, title, status, views_count, helpful_votes, not_helpful_votes, reading_time_min, updated_at")
    .eq("org_id", profile.org_id)
    .order("views_count", { ascending: false });

  const { data: feedback } = await supabase
    .from("article_feedback")
    .select("article_id, is_helpful, created_at")
    .in("article_id", (articles ?? []).map((a) => a.id))
    .order("created_at", { ascending: false })
    .limit(200);

  const all = articles ?? [];
  const pub = all.filter((a) => a.status === "published");

  const totalViews    = all.reduce((s, a) => s + (a.views_count ?? 0), 0);
  const totalHelpful  = all.reduce((s, a) => s + (a.helpful_votes ?? 0), 0);
  const totalUnhelpful = all.reduce((s, a) => s + (a.not_helpful_votes ?? 0), 0);
  const totalFeedback  = totalHelpful + totalUnhelpful;
  const satisfactionRate = totalFeedback > 0
    ? Math.round((totalHelpful / totalFeedback) * 100)
    : null;

  const topViewed  = [...pub].sort((a, b) => (b.views_count ?? 0) - (a.views_count ?? 0)).slice(0, 10);
  const topRated   = [...pub]
    .filter((a) => (a.helpful_votes ?? 0) > 0)
    .sort((a, b) => (b.helpful_votes ?? 0) - (a.helpful_votes ?? 0))
    .slice(0, 10);
  const needsWork  = [...pub]
    .filter((a) => (a.not_helpful_votes ?? 0) > 0)
    .sort((a, b) => (b.not_helpful_votes ?? 0) - (a.not_helpful_votes ?? 0))
    .slice(0, 5);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/knowledge-base"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors">
          <ArrowLeft size={14} />Knowledge Base
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <TrendingUp size={20} className="text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">KB Analytics</h1>
          <p className="text-sm text-muted-foreground">{pub.length} published articles</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Views",      value: totalViews.toLocaleString(), icon: Eye,      color: "text-primary"  },
          { label: "Helpful Votes",    value: totalHelpful.toLocaleString(), icon: ThumbsUp, color: "text-success" },
          { label: "Not Helpful",      value: totalUnhelpful.toLocaleString(), icon: ThumbsDown, color: "text-destructive" },
          { label: "Satisfaction",     value: satisfactionRate !== null ? `${satisfactionRate}%` : "—", icon: Star, color: "text-amber-500" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="sc-card p-4 space-y-2">
            <div className="flex items-center gap-1.5">
              <Icon size={13} className={color} />
              <p className="text-[11px] text-muted-foreground">{label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Viewed */}
        <div className="sc-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Eye size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Most Viewed</h2>
          </div>
          <div className="divide-y divide-border">
            {topViewed.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No views tracked yet.</p>
            )}
            {topViewed.map((a, i) => (
              <Link key={a.id} href={`/knowledge-base/${a.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-hover/50 transition-colors">
                <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                <span className="text-xs text-foreground flex-1 truncate">{a.title}</span>
                <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                  <Eye size={11} />{a.views_count ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Top Rated */}
        <div className="sc-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <ThumbsUp size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Most Helpful</h2>
          </div>
          <div className="divide-y divide-border">
            {topRated.length === 0 && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No feedback collected yet.</p>
            )}
            {topRated.map((a, i) => {
              const total = (a.helpful_votes ?? 0) + (a.not_helpful_votes ?? 0);
              const pct   = total > 0 ? Math.round(((a.helpful_votes ?? 0) / total) * 100) : 0;
              return (
                <Link key={a.id} href={`/knowledge-base/${a.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-hover/50 transition-colors">
                  <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <span className="text-xs text-foreground flex-1 truncate">{a.title}</span>
                  <span className="text-xs text-success shrink-0">{pct}% helpful</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Needs improvement */}
      {needsWork.length > 0 && (
        <div className="sc-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <ThumbsDown size={14} className="text-destructive" />
            <h2 className="text-sm font-semibold text-foreground">Needs Improvement</h2>
            <p className="text-xs text-muted-foreground ml-1">— articles with most unhelpful votes</p>
          </div>
          <div className="divide-y divide-border">
            {needsWork.map((a) => (
              <Link key={a.id} href={`/knowledge-base/${a.id}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-hover/50 transition-colors">
                <span className="text-xs text-foreground flex-1 truncate">{a.title}</span>
                <span className="text-xs text-destructive shrink-0 flex items-center gap-1">
                  <ThumbsDown size={11} />{a.not_helpful_votes}
                </span>
                <span className="text-xs text-success shrink-0 flex items-center gap-1">
                  <ThumbsUp size={11} />{a.helpful_votes ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
