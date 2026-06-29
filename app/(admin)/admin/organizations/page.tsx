import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { PLAN_NAMES, resolveEffectivePlan } from "@/lib/plans";
import { BadgeCheck, ChevronRight } from "lucide-react";
import type { OrgPlan } from "@/types/database";

export default async function AdminOrganizationsPage() {
  const supabase = createAdminClient();

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, slug, plan, freepass_plan, freepass_until, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Organizations</h1>
      <p className="text-muted-foreground mb-6">{orgs?.length ?? 0} total</p>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Free Pass</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(orgs ?? []).map((org) => {
              const effective = resolveEffectivePlan({
                plan:           org.plan as OrgPlan,
                freepass_plan:  org.freepass_plan,
                freepass_until: org.freepass_until,
              });
              const hasFreepass = effective !== org.plan;
              const fpUntil = org.freepass_until
                ? new Date(org.freepass_until).toLocaleDateString()
                : "Permanent";

              return (
                <tr key={org.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{org.slug}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                      {PLAN_NAMES[effective]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {hasFreepass ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium">
                        <BadgeCheck size={13} />
                        {PLAN_NAMES[org.freepass_plan as OrgPlan]} · {fpUntil}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Manage <ChevronRight size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(orgs ?? []).length === 0 && (
          <p className="text-center py-10 text-muted-foreground text-sm">No organizations yet.</p>
        )}
      </div>
    </div>
  );
}
