"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { StatusSlice } from "@/lib/dashboard/queries";

interface Props {
  data: StatusSlice[];
}

export function StatusDonutChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (!total) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
        No tickets yet
      </div>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="45%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background:   "white",
              border:       "1px solid oklch(0.90 0.01 264)",
              borderRadius: "0.75rem",
              fontSize:     12,
              boxShadow:    "0 4px 16px -2px rgba(0,0,0,0.10)",
            }}
            formatter={(value, name) => [
              `${value ?? 0} (${Math.round(((value as number ?? 0) / total) * 100)}%)`,
              name as string,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: -12 }}>
        <span className="text-2xl font-bold tabular-nums">{total}</span>
        <span className="text-[10px] text-muted-foreground font-medium">total</span>
      </div>
    </div>
  );
}
