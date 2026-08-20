import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PLAN_NAMES, resolveEffectivePlan } from "@/lib/plans";
import { GrantFreepassDialog } from "./GrantFreepassDialog";
import { RevokeFreepassButton } from "./RevokeFreepassButton";
import { ChevronLeft, BadgeCheck, Users, Ticket, Zap } from "lucide-react";
import type { OrgPlan } from "@/lib/generated/prisma/client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminOrgDetailPage({ params }: Props) {
  const { id } = await params;

  const [org, members, ticketCount, aiCount] = await Promise.all([
    prisma.organization.findUnique({ where: { id } }),
    prisma.profile.findMany({
      where:  { organizationId: id },
      select: { id: true, fullName: true, email: true, role: true, isActive: true },
    }),
    prisma.ticket.count({ where: { organizationId: id } }),
    prisma.aiUsageLog.count({ where: { organizationId: id } }),
  ]);

  if (!org) notFound();

  const effective = resolveEffectivePlan({
    plan:           org.plan,
    freepass_plan:  org.freepassPlan ?? null,
    freepass_until: org.freepassUntil?.toISOString() ?? null,
  });

  const hasFreepass =
    org.freepassPlan &&
    (!org.freepassUntil || org.freepassUntil > new Date());

  return (
    <div>
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5"
      >
        <ChevronLeft size={14} /> Organizations
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-muted-foreground text-sm font-mono">{org.slug}</p>
        </div>
        <span className="inline-flex items-center rounded-md bg-muted px-3 py-1 text-sm font-medium">
          {PLAN_NAMES[effective]}
          {hasFreepass && (
            <span className="ml-1.5 text-amber-500">
              <BadgeCheck size={13} />
            </span>
          )}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Members", value: members?.length ?? 0,  icon: Users  },
          { label: "Tickets", value: ticketCount ?? 0,      icon: Ticket },
          { label: "AI Calls", value: aiCount    ?? 0,      icon: Zap    },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <Icon size={18} className="text-muted-foreground" />
            <div>
              <p className="text-xl font-bold">{value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Free pass section */}
      <div className="rounded-xl border border-border bg-card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-1">Free Pass</h2>
        {hasFreepass ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Active:{" "}
                <span className="font-medium text-foreground">
                  {PLAN_NAMES[org.freepassPlan as OrgPlan]}
                </span>
                {" "}until{" "}
                <span className="font-medium text-foreground">
                  {org.freepassUntil
                    ? org.freepassUntil.toLocaleDateString("en-US", { dateStyle: "long" })
                    : "Permanent"}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              <GrantFreepassDialog orgId={org.id} currentFreepassPlan={org.freepassPlan as OrgPlan} />
              <RevokeFreepassButton orgId={org.id} />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">No active free pass. Base plan: {PLAN_NAMES[org.plan]}.</p>
            <GrantFreepassDialog orgId={org.id} currentFreepassPlan={null} />
          </div>
        )}
      </div>

      {/* Members */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Members ({members?.length ?? 0})</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{m.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                    {m.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.isActive
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {m.isActive ? "Active" : "Suspended"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
