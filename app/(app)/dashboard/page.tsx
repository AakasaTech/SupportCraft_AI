import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth/helpers";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { ChartsSection } from "@/components/dashboard/charts/ChartsSection";
import { AssignedTicketsWidget } from "@/components/dashboard/widgets/AssignedTicketsWidget";
import { RecentActivityWidget } from "@/components/dashboard/widgets/RecentActivityWidget";
import { AIInsightsWidget } from "@/components/dashboard/widgets/AIInsightsWidget";
import { TeamPerformanceWidget } from "@/components/dashboard/widgets/TeamPerformanceWidget";
import { SLAWidget } from "@/components/dashboard/widgets/SLAWidget";
import { QuickActionsWidget } from "@/components/dashboard/widgets/QuickActionsWidget";
import { CustomerInsightsWidget } from "@/components/dashboard/widgets/CustomerInsightsWidget";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

export const metadata: Metadata = { title: "Dashboard — SupportCraft AI" };

// No caching — dashboard data changes frequently
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { profile } = await requireAuth();
  const orgId  = profile.org_id;
  const userId = profile.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome banner */}
      <Suspense fallback={<div className="h-28 animate-pulse bg-muted rounded-2xl mx-6 mt-6" />}>
        <WelcomeBanner orgId={orgId} userId={userId} />
      </Suspense>

      <div className="px-6 pb-8 space-y-6 max-w-screen-2xl mx-auto">

        {/* KPI Grid */}
        <Suspense fallback={<DashboardSkeleton rows={1} cols={3} height={100} />}>
          <KpiGrid orgId={orgId} userId={userId} />
        </Suspense>

        {/* Charts row */}
        <Suspense fallback={<DashboardSkeleton rows={1} cols={3} height={260} />}>
          <ChartsSection orgId={orgId} />
        </Suspense>

        {/* Main content: 2-col layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Left column — 2/3 width */}
          <div className="xl:col-span-2 space-y-6">

            {/* SLA alerts at the top (if any overdue tickets) */}
            <Suspense fallback={<DashboardSkeleton rows={3} cols={1} height={56} />}>
              <SLAWidget orgId={orgId} />
            </Suspense>

            {/* Assigned to me */}
            <Suspense fallback={<DashboardSkeleton rows={5} cols={1} height={56} />}>
              <AssignedTicketsWidget orgId={orgId} userId={userId} />
            </Suspense>

            {/* Team performance */}
            <Suspense fallback={<DashboardSkeleton rows={4} cols={1} height={56} />}>
              <TeamPerformanceWidget orgId={orgId} />
            </Suspense>

            {/* Recent activity */}
            <Suspense fallback={<DashboardSkeleton rows={8} cols={1} height={48} />}>
              <RecentActivityWidget orgId={orgId} />
            </Suspense>

          </div>

          {/* Right column — 1/3 width */}
          <div className="space-y-6">

            <QuickActionsWidget />

            <Suspense fallback={<DashboardSkeleton rows={4} cols={1} height={64} />}>
              <AIInsightsWidget orgId={orgId} userId={userId} />
            </Suspense>

            <Suspense fallback={<DashboardSkeleton rows={5} cols={1} height={52} />}>
              <CustomerInsightsWidget orgId={orgId} />
            </Suspense>

          </div>
        </div>
      </div>
    </div>
  );
}
