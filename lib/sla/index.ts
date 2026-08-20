import type { TicketPriority } from "@/lib/generated/prisma/client";

// ─── SLA thresholds (hours) ───────────────────────────────────────────────────
// first_response / resolution per priority

const SLA_THRESHOLDS: Record<TicketPriority, { firstResponse: number; resolution: number }> = {
  urgent: { firstResponse: 1,  resolution: 4  },
  high:   { firstResponse: 4,  resolution: 8  },
  medium: { firstResponse: 8,  resolution: 24 },
  low:    { firstResponse: 24, resolution: 72 },
};

export type SLAStatus = "ok" | "warning" | "breached";

export interface SLAInfo {
  firstResponseDue:  Date;
  resolutionDue:     Date;
  firstResponseStatus: SLAStatus;
  resolutionStatus:    SLAStatus;
  firstResponseLabel:  string;
  resolutionLabel:     string;
  isBreached:          boolean;
}

function hoursFromNow(date: Date): number {
  return (date.getTime() - Date.now()) / 36e5;
}

function formatDue(hours: number): string {
  if (hours < 0) {
    const abs = Math.abs(hours);
    if (abs < 1)   return `${Math.round(abs * 60)}m overdue`;
    if (abs < 24)  return `${Math.round(abs)}h overdue`;
    return `${Math.floor(abs / 24)}d overdue`;
  }
  if (hours < 1)   return `${Math.round(hours * 60)}m left`;
  if (hours < 24)  return `${Math.round(hours)}h left`;
  return `${Math.floor(hours / 24)}d left`;
}

function toStatus(hoursRemaining: number): SLAStatus {
  if (hoursRemaining < 0)   return "breached";
  if (hoursRemaining < 1)   return "warning";
  return "ok";
}

export function computeSLA(
  createdAt:      string | Date,
  priority:       TicketPriority,
  firstResponseAt?: string | Date | null,
  resolvedAt?:      string | Date | null,
): SLAInfo {
  const created  = new Date(createdAt);
  const thresholds = SLA_THRESHOLDS[priority] ?? SLA_THRESHOLDS.medium;

  const firstResponseDue = new Date(created.getTime() + thresholds.firstResponse * 36e5);
  const resolutionDue    = new Date(created.getTime() + thresholds.resolution    * 36e5);

  // First response: already done → check if it was done in time
  let firstResponseStatus: SLAStatus;
  let firstResponseLabel:  string;
  if (firstResponseAt) {
    const respTime = new Date(firstResponseAt);
    firstResponseStatus = respTime <= firstResponseDue ? "ok" : "breached";
    firstResponseLabel  = firstResponseStatus === "ok" ? "Responded on time" : "Responded late";
  } else {
    const hoursLeft = hoursFromNow(firstResponseDue);
    firstResponseStatus = toStatus(hoursLeft);
    firstResponseLabel  = formatDue(hoursLeft);
  }

  // Resolution: already done → check if done in time
  let resolutionStatus: SLAStatus;
  let resolutionLabel:  string;
  if (resolvedAt) {
    const resTime = new Date(resolvedAt);
    resolutionStatus = resTime <= resolutionDue ? "ok" : "breached";
    resolutionLabel  = resolutionStatus === "ok" ? "Resolved on time" : "Resolved late";
  } else {
    const hoursLeft = hoursFromNow(resolutionDue);
    resolutionStatus = toStatus(hoursLeft);
    resolutionLabel  = formatDue(hoursLeft);
  }

  return {
    firstResponseDue,
    resolutionDue,
    firstResponseStatus,
    resolutionStatus,
    firstResponseLabel,
    resolutionLabel,
    isBreached: firstResponseStatus === "breached" || resolutionStatus === "breached",
  };
}

export function getSLAColor(status: SLAStatus): string {
  switch (status) {
    case "breached": return "text-destructive";
    case "warning":  return "text-warning-foreground";
    default:         return "text-success";
  }
}

export function getSLABgColor(status: SLAStatus): string {
  switch (status) {
    case "breached": return "bg-destructive-subtle text-destructive";
    case "warning":  return "bg-warning-subtle text-warning-foreground";
    default:         return "bg-success-subtle text-success";
  }
}
