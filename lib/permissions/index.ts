import type { UserRole } from "@/lib/generated/prisma/client";

// Role hierarchy: owner > admin > agent > viewer
const ROLE_RANK: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  agent: 2,
  viewer: 1,
};

function atLeast(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

// ── Billing ──────────────────────────────────────────────────────────────────
export function canManageBilling(role: UserRole): boolean {
  return role === "owner";
}

// ── Organization ─────────────────────────────────────────────────────────────
export function canDeleteOrganization(role: UserRole): boolean {
  return role === "owner";
}

export function canManageSettings(role: UserRole): boolean {
  return atLeast(role, "admin");
}

// ── Team / users ─────────────────────────────────────────────────────────────
export function canManageUsers(role: UserRole): boolean {
  return atLeast(role, "admin");
}

export function canInviteMembers(role: UserRole): boolean {
  return atLeast(role, "admin");
}

export function canRemoveMembers(role: UserRole): boolean {
  return atLeast(role, "admin");
}

export function canChangeRoles(role: UserRole): boolean {
  return role === "owner";
}

// ── Tickets ───────────────────────────────────────────────────────────────────
export function canCreateTickets(role: UserRole): boolean {
  return atLeast(role, "agent");
}

export function canDeleteTickets(role: UserRole): boolean {
  return atLeast(role, "admin");
}

export function canAssignTickets(role: UserRole): boolean {
  return atLeast(role, "agent");
}

export function canReplyToTickets(role: UserRole): boolean {
  return atLeast(role, "agent");
}

// ── Knowledge base ────────────────────────────────────────────────────────────
export function canManageKnowledgeBase(role: UserRole): boolean {
  return atLeast(role, "agent");
}

export function canPublishArticles(role: UserRole): boolean {
  return atLeast(role, "admin");
}

// ── Customers ─────────────────────────────────────────────────────────────────
export function canManageCustomers(role: UserRole): boolean {
  return atLeast(role, "agent");
}

export function canDeleteCustomers(role: UserRole): boolean {
  return atLeast(role, "admin");
}

// ── AI features ───────────────────────────────────────────────────────────────
export function canUseAI(role: UserRole): boolean {
  return atLeast(role, "agent");
}

// ── Reports / analytics ───────────────────────────────────────────────────────
export function canViewReports(role: UserRole): boolean {
  return atLeast(role, "agent");
}

export function canViewAuditLogs(role: UserRole): boolean {
  return atLeast(role, "admin");
}

// ── Generic permission check ──────────────────────────────────────────────────
export type Permission =
  | "billing:manage"
  | "org:delete"
  | "org:settings"
  | "users:manage"
  | "users:invite"
  | "users:remove"
  | "roles:change"
  | "tickets:create"
  | "tickets:delete"
  | "tickets:assign"
  | "tickets:reply"
  | "kb:manage"
  | "kb:publish"
  | "customers:manage"
  | "customers:delete"
  | "ai:use"
  | "reports:view"
  | "audit:view";

const PERMISSION_CHECK: Record<Permission, (role: UserRole) => boolean> = {
  "billing:manage": canManageBilling,
  "org:delete": canDeleteOrganization,
  "org:settings": canManageSettings,
  "users:manage": canManageUsers,
  "users:invite": canInviteMembers,
  "users:remove": canRemoveMembers,
  "roles:change": canChangeRoles,
  "tickets:create": canCreateTickets,
  "tickets:delete": canDeleteTickets,
  "tickets:assign": canAssignTickets,
  "tickets:reply": canReplyToTickets,
  "kb:manage": canManageKnowledgeBase,
  "kb:publish": canPublishArticles,
  "customers:manage": canManageCustomers,
  "customers:delete": canDeleteCustomers,
  "ai:use": canUseAI,
  "reports:view": canViewReports,
  "audit:view": canViewAuditLogs,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return PERMISSION_CHECK[permission](role);
}
