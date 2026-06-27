"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { PriorityBar } from "@/lib/dashboard/queries";

interface Props {
  data: PriorityBar[];
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: "#DC2626",
  High:   "#D97706",
  Medium: "#5148D0",
  Low:    "#64748B",
};

export function PriorityBarChart({ data }: Props) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">
        No active tickets
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }} barSize={28}>
        <XAxis
          dataKey="priority"
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
          cursor={{ fill: "oklch(0.95 0.01 264)" }}
        />
        <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? "#64748B"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
