import { TicketVolumeChart } from "./TicketVolumeChart";
import { StatusDonutChart } from "./StatusDonutChart";
import { PriorityBarChart } from "./PriorityBarChart";
import { getChartData } from "@/lib/dashboard/queries";

interface Props {
  orgId: string;
}

export async function ChartsSection({ orgId }: Props) {
  const { volumeData, statusData, priorityData } = await getChartData(orgId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

      {/* Ticket volume — 2/3 width */}
      <div className="lg:col-span-2 sc-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Ticket Volume</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Created vs resolved — last 7 days</p>
        </div>
        <TicketVolumeChart data={volumeData} />
      </div>

      {/* Status distribution — 1/3 width */}
      <div className="sc-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Status Breakdown</h3>
          <p className="text-xs text-muted-foreground mt-0.5">All tickets</p>
        </div>
        <StatusDonutChart data={statusData} />
      </div>

      {/* Priority chart — 1/3 */}
      <div className="sc-card p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold">Priority Distribution</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Open & pending tickets</p>
        </div>
        <PriorityBarChart data={priorityData} />
      </div>

      {/* Placeholder: Channel & Category coming soon */}
      <div className="sc-card p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
        <div className="p-2.5 rounded-xl bg-primary-subtle">
          <span className="text-primary text-xl">📊</span>
        </div>
        <p className="text-sm font-medium">Category Insights</p>
        <p className="text-xs text-muted-foreground max-w-[160px]">
          Add categories to your tickets to see trends here.
        </p>
      </div>

      <div className="sc-card p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
        <div className="p-2.5 rounded-xl bg-ai-subtle">
          <span className="text-ai text-xl">⚡</span>
        </div>
        <p className="text-sm font-medium">Response Trends</p>
        <p className="text-xs text-muted-foreground max-w-[160px]">
          Track average response times as your team grows.
        </p>
      </div>

    </div>
  );
}
