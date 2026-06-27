import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

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
  metadata?: Record<string, Json>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Inserts an audit log entry using the admin client (bypasses RLS).
 * Never throws — audit logging should never break application flow.
 */
export async function logAuditEvent(options: LogAuditEventOptions): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      org_id: options.orgId,
      user_id: options.userId ?? null,
      event: options.event,
      metadata: (options.metadata ?? {}) as Json,
      ip_address: options.ipAddress ?? null,
      user_agent: options.userAgent ?? null,
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
