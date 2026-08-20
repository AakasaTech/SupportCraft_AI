import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";

export type AuditEvent =
  // Auth
  | "auth.login"
  | "auth.logout"
  | "auth.register"
  | "auth.password_reset"
  | "auth.password_updated"
  | "auth.oauth_login"
  | "auth.magic_link"
  // Team
  | "team.member_invited"
  | "team.member_removed"
  | "team.role_changed"
  | "team.invitation_accepted"
  // Organization
  | "org.settings_updated"
  | "org.deleted"
  // Tickets
  | "ticket.created"
  | "ticket.status_changed"
  | "ticket.assigned"
  | "ticket.deleted"
  | "ticket.reply_sent"
  // Customers
  | "customer.created"
  | "customer.updated"
  | "customer.deleted"
  // Knowledge base
  | "kb.article_created"
  | "kb.article_published"
  | "kb.article_deleted"
  // Billing
  | "billing.plan_upgraded"
  | "billing.plan_cancelled"
  // AI
  | "ai.suggestion_generated"
  | "ai.categorization_run";

interface LogAuditEventOptions {
  orgId: string;
  userId?: string;
  event: AuditEvent;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Inserts an audit log entry. Never throws — audit logging should never
 * break application flow.
 *
 * `userId` must be a User.id (session.user.id), not a Profile.id — the two
 * are different primary keys since the NextAuth migration.
 */
export async function logAuditEvent(options: LogAuditEventOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: options.orgId,
        userId: options.userId ?? null,
        event: options.event,
        metadata: options.metadata ?? {},
        ipAddress: options.ipAddress ?? null,
        userAgent: options.userAgent ?? null,
      },
    });
  } catch {
    // Silently swallow — audit failures must never interrupt business logic
  }
}

/**
 * Extract IP address from a Request object (handles common proxy headers).
 */
export function getClientIp(request: Request): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    undefined
  );
}
