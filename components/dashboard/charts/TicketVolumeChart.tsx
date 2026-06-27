"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { DayPoint } from "@/lib/dashboard/queries";

interface Props {
  data: DayPoint[];
}

const CREATED_COLOR  = "#5148D0";
const RESOLVED_COLOR = "#16A34A";

export function TicketVolumeChart({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        No ticket data for the last 7 days
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={CREATED_COLOR}  stopOpacity={0.2} />
            <stop offset="95%" stopColor={CREATED_COLOR}  stopOpacity={0} />
          </linearGradient>
          <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={RESOLVED_COLOR} stopOpacity={0.15} />
            <stop offset="95%" stopColor={RESOLVED_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.90 0.01 264)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "oklch(0.50 0.02 264)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "oklch(0.50 0.02 264)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background:   "white",
            border:       "1px solid oklch(0.90 0.01 264)",
            borderRadius: "0.75rem",
            fontSize:     12,
            boxShadow:    "0 4px 16px -2px rgba(0,0,0,0.10)",
          }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="created"
          name="Created"
          stroke={CREATED_COLOR}
          strokeWidth={2}
          fill="url(#createdGrad)"
          dot={false}
          activeDot={{ r: 4, fill: CREATED_COLOR }}
        />
        <Area
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke={RESOLVED_COLOR}
          strokeWidth={2}
          fill="url(#resolvedGrad)"
          dot={false}
          activeDot={{ r: 4, fill: RESOLVED_COLOR }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
