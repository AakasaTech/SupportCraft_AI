import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Megaphone, Pin, Info, AlertTriangle, Wrench, Sparkles } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Announcements" };

const TYPE_CONFIG = {
  info:        { icon: Info,          label: "Info",        style: "bg-info-subtle text-info border-info/20" },
  warning:     { icon: AlertTriangle, label: "Warning",     style: "bg-warning-subtle text-warning-foreground border-warning/20" },
  maintenance: { icon: Wrench,        label: "Maintenance", style: "bg-muted text-muted-foreground border-border" },
  feature:     { icon: Sparkles,      label: "New Feature", style: "bg-primary/10 text-primary border-primary/20" },
} as const;

export default async function PortalAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) redirect("/portal/dashboard");

  const orgIds = [...new Set(customers.map((c) => c.org_id))];
  const admin  = createAdminClient();

  const { data: announcements } = await admin
    .from("announcements")
    .select("id, title, content, type, is_pinned, published_at")
    .in("org_id", orgIds)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(50);

  const items = announcements ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Stay up to date with maintenance windows, new features, and known issues.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="sc-card p-10 text-center space-y-3">
          <Megaphone size={32} className="text-muted-foreground mx-auto" />
          <p className="font-medium text-foreground">No announcements yet</p>
          <p className="text-sm text-muted-foreground">Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const config  = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
            const Icon    = config.icon;
            return (
              <div key={item.id} className="sc-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                      config.style,
                    )}>
                      <Icon size={11} />
                      {config.label}
                    </span>
                    {item.is_pinned && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Pin size={11} />
                        Pinned
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground shrink-0">
                    {new Date(item.published_at!).toLocaleDateString([], {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </time>
                </div>
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {item.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
