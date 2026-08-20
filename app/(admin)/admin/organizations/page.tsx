import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PLAN_NAMES, resolveEffectivePlan } from "@/lib/plans";
import { BadgeCheck, ChevronRight } from "lucide-react";
import type { OrgPlan } from "@/lib/generated/prisma/client";

export default async function AdminOrganizationsPage() {
  const orgs = await prisma.organization.findMany({
    select:  { id: true, name: true, slug: true, plan: true, freepassPlan: true, freepassUntil: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Organizations</h1>
      <p className="text-muted-foreground mb-6">{orgs.length} total</p>

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
            {orgs.map((org) => {
              const effective = resolveEffectivePlan({
                plan:           org.plan,
                freepass_plan:  org.freepassPlan,
                freepass_until: org.freepassUntil?.toISOString() ?? null,
              });
              const hasFreepass = effective !== org.plan;
              const fpUntil = org.freepassUntil
                ? org.freepassUntil.toLocaleDateString()
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
                        {PLAN_NAMES[org.freepassPlan as OrgPlan]} · {fpUntil}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {org.createdAt.toLocaleDateString()}
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
