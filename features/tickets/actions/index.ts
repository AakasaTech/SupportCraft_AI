"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { requireAuth } from "@/lib/auth/helpers";
import { logAuditEvent } from "@/lib/audit";
import { sendNewTicketEmail, sendTicketReplyEmail } from "@/lib/resend";
import { getOrgEmail } from "@/lib/email/platform-provider";
import { getPlanLimits, resolveEffectivePlan } from "@/lib/plans";
import { dispatchWebhookEvent } from "@/lib/webhooks";
import {
  createTicketSchema,
  updateTicketSchema,
  replyTicketSchema,
  bulkActionSchema,
  savedViewSchema,
} from "../schemas";

// ─── Webhook helper ───────────────────────────────────────────────────────────

async function notifyTicketStatusChanged(ticketId: string) {
  const t = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { organizationId: true, ticketNumber: true, title: true, status: true, priority: true },
  });
  if (!t) return;
  dispatchWebhookEvent(t.organizationId, "ticket.status_changed", {
    id: ticketId,
    number: t.ticketNumber ?? "",
    title: t.title,
    status: t.status,
    priority: t.priority,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/tickets/${ticketId}`,
  }).catch(() => {});
}

// ─── Create ticket ────────────────────────────────────────────────────────────

export async function createTicket(formData: FormData) {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  // Enforce monthly ticket limit for the Free plan
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, freepassPlan: true, freepassUntil: true },
  });
  if (org) {
    const effectivePlan = resolveEffectivePlan({
      plan: org.plan,
      freepass_plan: org.freepassPlan,
      freepass_until: org.freepassUntil?.toISOString() ?? null,
    });
    const limits = getPlanLimits(effectivePlan);
    if (limits.tickets !== Infinity) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const count = await prisma.ticket.count({
        where: { organizationId: orgId, createdAt: { gte: startOfMonth } },
      });
      if (count >= limits.tickets) {
        return {
          error: `Your Free plan allows ${limits.tickets} tickets per month. Upgrade to create more.`,
        };
      }
    }
  }

  const tagsRaw = formData.get("tags") as string;
  const parsed = createTicketSchema.safeParse({
    title:       formData.get("title"),
    description: formData.get("description"),
    priority:    formData.get("priority") || "medium",
    source:      formData.get("source") || "manual",
    customerId:  formData.get("customerId") || undefined,
    assigneeId:  formData.get("assigneeId") || undefined,
    category:    formData.get("category") || undefined,
    department:  formData.get("department") || undefined,
    tags:        tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [],
    dueDate:     formData.get("dueDate") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { customerId, assigneeId, dueDate, templateId: _t, ...rest } = parsed.data;

  let ticket: { id: string; ticketNumber: string | null };
  try {
    ticket = await prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          ...rest,
          organizationId: orgId,
          customerId: customerId ?? null,
          assigneeId: assigneeId ?? null,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
        select: { id: true, ticketNumber: true },
      });

      // Insert description as the first message so it appears in the conversation thread
      await tx.ticketMessage.create({
        data: {
          ticketId: created.id,
          authorId: null,
          content: parsed.data.description,
          isAi: false,
          isCustomer: true,
          isInternal: false,
        },
      });

      return created;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create ticket" };
  }

  // Email assigned agent
  try {
    if (assigneeId && customerId) {
      const [assignee, customer] = await Promise.all([
        prisma.profile.findUnique({ where: { id: assigneeId }, select: { email: true, fullName: true } }),
        prisma.customer.findUnique({ where: { id: customerId }, select: { name: true } }),
      ]);
      if (assignee?.email) {
        await sendNewTicketEmail({
          to: assignee.email,
          agentName: assignee.fullName ?? "Agent",
          ticketTitle: parsed.data.title,
          ticketId: ticket.id,
          customerName: customer?.name ?? "Customer",
          ticketNumber: ticket.ticketNumber ?? undefined,
        });
      }
    }
  } catch {
    // Email failure is non-fatal
  }

  await logAuditEvent({ event: "ticket.created", orgId, userId: user.id, metadata: { ticketId: ticket.id } });

  dispatchWebhookEvent(orgId, "ticket.created", {
    id: ticket.id,
    number: ticket.ticketNumber ?? "",
    title: parsed.data.title,
    status: "new",
    priority: parsed.data.priority,
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/tickets/${ticket.id}`,
  }).catch(() => {});

  revalidatePath("/tickets");
  return { ticketId: ticket.id, ticketNumber: ticket.ticketNumber };
}

// ─── Update ticket ────────────────────────────────────────────────────────────

export async function updateTicket(formData: FormData) {
  const user = await requireAuth();

  const tagsRaw = formData.get("tags") as string;
  const parsed = updateTicketSchema.safeParse({
    ticketId:   formData.get("ticketId"),
    title:      formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    status:     formData.get("status") || undefined,
    priority:   formData.get("priority") || undefined,
    assigneeId: formData.get("assigneeId") || undefined,
    category:   formData.get("category") || undefined,
    department: formData.get("department") || undefined,
    tags:       tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
    dueDate:    formData.get("dueDate") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { ticketId, assigneeId, dueDate, ...updates } = parsed.data;
  const now = new Date();
  const data: Record<string, unknown> = {};

  if (updates.title) data.title = updates.title;
  if (updates.description) data.description = updates.description;
  if (updates.status) data.status = updates.status;
  if (updates.priority) data.priority = updates.priority;
  if (updates.category !== undefined) data.category = updates.category;
  if (updates.department !== undefined) data.department = updates.department;
  if (updates.tags) data.tags = updates.tags;
  if (assigneeId !== undefined) data.assigneeId = assigneeId;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;

  if (updates.status === "resolved") data.resolvedAt = now;
  if (updates.status === "closed") data.closedAt = now;

  try {
    await prisma.ticket.update({ where: { id: ticketId }, data });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update ticket" };
  }

  if (updates.status) {
    await logAuditEvent({
      event: "ticket.status_changed",
      orgId: user.profile.organizationId,
      userId: user.id,
      metadata: { ticketId, newStatus: updates.status },
    });
    notifyTicketStatusChanged(ticketId);
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}

// ─── Update ticket field (inline editing) ────────────────────────────────────

const ALLOWED_FIELDS = ["status", "priority", "assigneeId", "category", "department", "tags", "dueDate", "title"] as const;
const FIELD_MAP: Record<string, string> = {
  assignee_id: "assigneeId",
  due_date: "dueDate",
};

export async function updateTicketField(ticketId: string, field: string, value: unknown) {
  await requireAuth();

  const mappedField = FIELD_MAP[field] ?? field;
  if (!ALLOWED_FIELDS.includes(mappedField as (typeof ALLOWED_FIELDS)[number])) {
    return { error: "Invalid field" };
  }

  const now = new Date();
  const data: Record<string, unknown> = { [mappedField]: value };

  if (mappedField === "status" && value === "resolved") data.resolvedAt = now;
  if (mappedField === "status" && value === "closed") data.closedAt = now;

  try {
    await prisma.ticket.update({ where: { id: ticketId }, data });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update ticket" };
  }

  if (mappedField === "status") {
    notifyTicketStatusChanged(ticketId);
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}

// ─── Reply to ticket ──────────────────────────────────────────────────────────

export async function replyToTicket(formData: FormData) {
  const user = await requireAuth();

  const parsed = replyTicketSchema.safeParse({
    ticketId:   formData.get("ticketId"),
    content:    formData.get("content"),
    isInternal: formData.get("isInternal") === "true",
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { ticketId, content, isInternal } = parsed.data;
  const now = new Date();

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId: user.profile.id,
      content,
      isAi: false,
      isCustomer: false,
      isInternal,
    },
    select: { id: true },
  });

  // Update ticket: mark firstResponseAt if this is the first agent reply
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: { firstResponseAt: true, status: true },
  });

  const ticketUpdate: Record<string, unknown> = {};
  if (!ticket?.firstResponseAt && !isInternal) ticketUpdate.firstResponseAt = now;
  if (!isInternal && ticket?.status === "pending") ticketUpdate.status = "open";

  if (Object.keys(ticketUpdate).length > 0) {
    await prisma.ticket.update({ where: { id: ticketId }, data: ticketUpdate });
  }

  // Email the customer when an agent sends a public reply
  if (!isInternal) {
    try {
      const [ticketData, agentProfile, lastInbound] = await Promise.all([
        prisma.ticket.findUnique({
          where: { id: ticketId },
          select: {
            title: true, ticketNumber: true, organizationId: true,
            customer: { select: { name: true, email: true } },
          },
        }),
        prisma.profile.findUnique({ where: { id: user.profile.id }, select: { fullName: true } }),
        prisma.emailMessage.findFirst({
          where: { ticketId },
          select: { messageId: true, messageReferences: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const customer = ticketData?.customer;
      if (!customer?.email || !ticketData) return { success: true, messageId: msg.id };

      const emailSettings = await prisma.emailSettings.findUnique({
        where: { organizationId: ticketData.organizationId },
        select: { tenantSlug: true, displayName: true },
      });

      const outboundMessageId = `reply-${ticketId}-${Date.now()}@supportcraft.aakasa.dev`;
      const prevRefs: string[] = lastInbound?.messageReferences ?? [];
      const inReplyToId = lastInbound?.messageId ?? undefined;
      const references = inReplyToId ? [...prevRefs, inReplyToId] : prevRefs;

      const fromAddress = emailSettings?.tenantSlug ? getOrgEmail(emailSettings.tenantSlug) : undefined;
      const displayName = emailSettings?.displayName ?? emailSettings?.tenantSlug ?? undefined;
      const replySubject = ticketData.ticketNumber
        ? `[Ticket #${ticketData.ticketNumber}] ${ticketData.title}`
        : ticketData.title;

      await sendTicketReplyEmail({
        to: customer.email,
        customerName: customer.name ?? "Customer",
        agentName: agentProfile?.fullName ?? "Support Team",
        ticketTitle: ticketData.title ?? "",
        replyContent: content,
        ticketId,
        ticketNumber: ticketData.ticketNumber ?? undefined,
        fromAddress,
        displayName,
        outboundMessageId,
        inReplyTo: inReplyToId,
        references: references.length ? references : undefined,
      });

      // Record outbound so customer replies thread back in
      await prisma.emailMessage.create({
        data: {
          organizationId: ticketData.organizationId,
          ticketId,
          direction: "outbound",
          messageId: outboundMessageId,
          inReplyTo: inReplyToId ?? null,
          messageReferences: references,
          fromAddress: fromAddress ?? "noreply@supportcraft.aakasa.dev",
          toAddress: customer.email,
          subject: replySubject,
          bodyPlain: content,
          status: "sent",
        },
      });
    } catch (e) {
      console.error("Reply email failed:", e);
    }
  }

  await logAuditEvent({
    event: "ticket.reply_sent",
    orgId: user.profile.organizationId,
    userId: user.id,
    metadata: { ticketId, messageId: msg.id, isInternal },
  });

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true, messageId: msg.id };
}

// ─── Bulk actions ─────────────────────────────────────────────────────────────

export async function bulkUpdateTickets(formData: FormData) {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  const idsRaw = formData.get("ticketIds") as string;
  const parsed = bulkActionSchema.safeParse({
    ticketIds:  idsRaw ? idsRaw.split(",") : [],
    action:     formData.get("action"),
    assigneeId: formData.get("assigneeId") || undefined,
    priority:   formData.get("priority") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { ticketIds, action, assigneeId, priority } = parsed.data;
  const now = new Date();

  const data: Record<string, unknown> = {};

  switch (action) {
    case "resolve":
      data.status = "resolved";
      data.resolvedAt = now;
      break;
    case "close":
      data.status = "closed";
      data.closedAt = now;
      break;
    case "setPriority":
      if (!priority) return { error: "Priority required" };
      data.priority = priority;
      break;
    case "assign":
      if (!assigneeId) return { error: "Assignee required" };
      data.assigneeId = assigneeId;
      break;
    case "delete": {
      if (!["owner", "admin"].includes(user.profile.role)) return { error: "Insufficient permissions" };
      await prisma.ticket.deleteMany({ where: { organizationId: orgId, id: { in: ticketIds } } });
      revalidatePath("/tickets");
      return { success: true, count: ticketIds.length };
    }
  }

  await prisma.ticket.updateMany({ where: { organizationId: orgId, id: { in: ticketIds } }, data });

  revalidatePath("/tickets");
  return { success: true, count: ticketIds.length };
}

// ─── Delete ticket ────────────────────────────────────────────────────────────

export async function deleteTicket(ticketId: string) {
  const user = await requireAuth();
  const orgId = user.profile.organizationId;

  await prisma.ticket.deleteMany({ where: { id: ticketId, organizationId: orgId } });

  await logAuditEvent({ event: "ticket.deleted", orgId, userId: user.id, metadata: { ticketId } });
  revalidatePath("/tickets");
  redirect("/tickets");
}

// ─── Saved views ──────────────────────────────────────────────────────────────

export async function createSavedView(formData: FormData) {
  const user = await requireAuth();

  const filtersRaw = formData.get("filters") as string;
  const parsed = savedViewSchema.safeParse({
    name:     formData.get("name"),
    filters:  filtersRaw ? JSON.parse(filtersRaw) : {},
    isShared: formData.get("isShared") === "true",
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.savedView.create({
    data: {
      organizationId: user.profile.organizationId,
      userId: user.profile.id,
      name: parsed.data.name,
      filters: parsed.data.filters as Prisma.InputJsonValue,
      isShared: parsed.data.isShared,
    },
  });

  revalidatePath("/tickets");
  return { success: true };
}

export async function deleteSavedView(viewId: string) {
  await requireAuth();
  await prisma.savedView.delete({ where: { id: viewId } });
  revalidatePath("/tickets");
  return { success: true };
}
