"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketStatus, TicketPriority, Profile, Department } from "@/lib/generated/prisma/client";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";

interface Props {
  agents:      Pick<Profile, "id" | "fullName">[];
  departments: Pick<Department, "id" | "name">[];
}

const STATUSES: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "new",         label: "New" },
  { value: "open",        label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "pending",     label: "Waiting" },
  { value: "resolved",    label: "Resolved" },
  { value: "closed",      label: "Closed" },
];

const PRIORITIES: { value: TicketPriority | ""; label: string }[] = [
  { value: "",       label: "Any Priority" },
  { value: "urgent", label: "Urgent" },
  { value: "high",   label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low",    label: "Low" },
];

function QuickFilter({ label, value, param, current }: {
  label: string; value: string; param: string; current: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const isActive = current === value;

  const toggle = () => {
    const params = new URLSearchParams(sp.toString());
    if (isActive) params.delete(param);
    else { params.set(param, value); params.set("page", "1"); }
    router.push(`/tickets?${params}`);
  };

  return (
    <button
      onClick={toggle}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
        isActive
          ? "bg-primary text-white"
          : "bg-muted text-muted-foreground hover:bg-border hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}

export function TicketFilters({ agents, departments }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const currentStatus   = sp.get("status") ?? "all";
  const currentPriority = sp.get("priority") ?? "";
  const currentAgent    = sp.get("assignee") ?? "";
  const currentDept     = sp.get("department") ?? "";
  const unassigned      = sp.get("unassigned") === "true";

  const activeFilterCount = [
    currentStatus && currentStatus !== "all",
    currentPriority,
    currentAgent,
    currentDept,
    unassigned,
  ].filter(Boolean).length;

  const applyFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (!value) params.delete(key);
    else params.set(key, value);
    params.set("page", "1");
    router.push(`/tickets?${params}`);
  }, [router, sp]);

  const clearAll = () => {
    router.push("/tickets");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status quick filters */}
      {STATUSES.map((s) => (
        <QuickFilter
          key={s.value}
          label={s.label}
          value={s.value}
          param="status"
          current={currentStatus}
        />
      ))}

      <div className="w-px h-5 bg-border" />

      {/* Advanced filter popover */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeFilterCount > 0
              ? "bg-primary-subtle text-primary"
              : "bg-muted text-muted-foreground hover:bg-border"
          )}>
            <Filter size={12} />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown size={11} />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-4 space-y-4">
          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Priority</label>
            <div className="flex flex-wrap gap-1">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => applyFilter("priority", p.value)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs transition-colors",
                    currentPriority === p.value
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground hover:bg-border"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Agent */}
          {agents.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Assigned To</label>
              <select
                value={currentAgent}
                onChange={(e) => applyFilter("assignee", e.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Any agent</option>
                <option value="unassigned">Unassigned</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Department */}
          {departments.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Department</label>
              <select
                value={currentDept}
                onChange={(e) => applyFilter("department", e.target.value)}
                className="w-full text-xs rounded-lg border border-border bg-background px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => { clearAll(); setOpen(false); }}
              className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
            >
              <X size={11} />Clear all filters
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
