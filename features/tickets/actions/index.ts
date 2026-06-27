"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/helpers";
import { logAuditEvent } from "@/lib/audit";
import { sendNewTicketEmail, sendTicketReplyEmail } from "@/lib/resend";
import {
  createTicketSchema,
  updateTicketSchema,
  replyTicketSchema,
  bulkActionSchema,
  savedViewSchema,
} from "../schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getOrgId(): Promise<{ orgId: string; userId: string }> {
  const { profile } = await requireAuth();
  return { orgId: profile.org_id, userId: profile.id };
}

// ─── Create ticket ────────────────────────────────────────────────────────────

export async function createTicket(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };

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

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      ...rest,
      org_id:      profile.org_id,
      customer_id: customerId ?? null,
      assignee_id: assigneeId ?? null,
      due_date:    dueDate ?? null,
    })
    .select("id, ticket_number")
    .single();

  if (error) return { error: error.message };

  // Insert description as the first message so it appears in the conversation thread
  try {
    const firstMsgPayload: Record<string, unknown> = {
      ticket_id:   ticket.id,
      author_id:   null,
      content:     parsed.data.description,
      is_ai:       false,
      is_customer: true,
    };
    await supabase.from("ticket_messages").insert({ ...firstMsgPayload, is_internal: false }).throwOnError();
  } catch {
    // Fallback if is_internal column not yet added (migration 003 pending)
    await supabase.from("ticket_messages").insert({
      ticket_id:   ticket.id,
      author_id:   null,
      content:     parsed.data.description,
      is_ai:       false,
      is_customer: true,
    });
  }

  // Email assigned agent
  try {
    if (assigneeId && customerId) {
      const [{ data: assignee }, { data: customer }] = await Promise.all([
        supabase.from("profiles").select("email, full_name").eq("id", assigneeId).single(),
        supabase.from("customers").select("name").eq("id", customerId).single(),
      ]);
      if (assignee?.email) {
        await sendNewTicketEmail({
          to:           assignee.email,
          agentName:    assignee.full_name ?? "Agent",
          ticketTitle:  parsed.data.title,
          ticketId:     ticket.id,
          customerName: customer?.name ?? "Customer",
          ticketNumber: ticket.ticket_number ?? undefined,
        });
      }
    }
  } catch {
    // Email failure is non-fatal
  }

  await logAuditEvent({ event: "ticket.created", orgId: profile.org_id, userId: user.id, metadata: { ticketId: ticket.id } });
  revalidatePath("/tickets");
  return { ticketId: ticket.id, ticketNumber: ticket.ticket_number };
}

// ─── Update ticket ────────────────────────────────────────────────────────────

export async function updateTicket(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

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
  const now = new Date().toISOString();
  const cleanUpdates: Record<string, unknown> = { updated_at: now };

  if (updates.title)       cleanUpdates.title       = updates.title;
  if (updates.description) cleanUpdates.description = updates.description;
  if (updates.status)      cleanUpdates.status      = updates.status;
  if (updates.priority)    cleanUpdates.priority    = updates.priority;
  if (updates.category !== undefined) cleanUpdates.category   = updates.category;
  if (updates.department !== undefined) cleanUpdates.department = updates.department;
  if (updates.tags)        cleanUpdates.tags        = updates.tags;
  if (assigneeId !== undefined) cleanUpdates.assignee_id = assigneeId;
  if (dueDate !== undefined)    cleanUpdates.due_date    = dueDate;

  // Track resolution/closure timestamps
  if (updates.status === "resolved") cleanUpdates.resolved_at = now;
  if (updates.status === "closed")   cleanUpdates.closed_at   = now;

  const { error } = await supabase
    .from("tickets")
    .update(cleanUpdates)
    .eq("id", ticketId);

  if (error) return { error: error.message };

  if (updates.status) {
    await logAuditEvent({ event: "ticket.status_changed", orgId: "", userId: user.id,
      metadata: { ticketId, newStatus: updates.status } });
  }

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}

// ─── Update ticket field (inline editing) ────────────────────────────────────

export async function updateTicketField(
  ticketId: string,
  field: string,
  value: unknown
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const now = new Date().toISOString();
  const update: Record<string, unknown> = { updated_at: now };

  const allowedFields = ["status", "priority", "assignee_id", "category", "department", "tags", "due_date", "title"];
  if (!allowedFields.includes(field)) return { error: "Invalid field" };

  update[field] = value;

  // Track timestamps
  if (field === "status" && value === "resolved") update.resolved_at = now;
  if (field === "status" && value === "closed")   update.closed_at   = now;

  const { error } = await supabase.from("tickets").update(update).eq("id", ticketId);
  if (error) return { error: error.message };

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}

// ─── Reply to ticket ──────────────────────────────────────────────────────────

export async function replyToTicket(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = replyTicketSchema.safeParse({
    ticketId:   formData.get("ticketId"),
    content:    formData.get("content"),
    isInternal: formData.get("isInternal") === "true",
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { ticketId, content, isInternal } = parsed.data;
  const now = new Date().toISOString();

  const { data: msg, error: msgError } = await supabase
    .from("ticket_messages")
    .insert({
      ticket_id:   ticketId,
      author_id:   user.id,
      content,
      is_ai:       false,
      is_customer: false,
      is_internal: isInternal,
    })
    .select("id")
    .single();

  if (msgError) return { error: msgError.message };

  // Update ticket: mark first_response_at if this is the first agent reply
  const { data: ticket } = await supabase
    .from("tickets")
    .select("first_response_at, status")
    .eq("id", ticketId)
    .single();

  const ticketUpdate: Record<string, unknown> = { updated_at: now };
  if (!ticket?.first_response_at && !isInternal) ticketUpdate.first_response_at = now;
  if (!isInternal && ticket?.status === "pending") ticketUpdate.status = "open";

  await supabase.from("tickets").update(ticketUpdate).eq("id", ticketId);

  // Email the customer when an agent sends a public reply
  if (!isInternal) {
    try {
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("title, ticket_number, customer:customers!customer_id(name, email)")
        .eq("id", ticketId)
        .single();
      const { data: agentProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const customer = ticketData?.customer as { name?: string; email?: string } | null;
      if (customer?.email) {
        await sendTicketReplyEmail({
          to:           customer.email,
          customerName: customer.name ?? "Customer",
          agentName:    agentProfile?.full_name ?? "Support Team",
          ticketTitle:  ticketData?.title ?? "",
          replyContent: content,
          ticketId,
          ticketNumber: ticketData?.ticket_number ?? undefined,
        });
      }
    } catch {
      // Email failure is non-fatal
    }
  }

  await logAuditEvent({ event: "ticket.reply_sent", orgId: "", userId: user.id,
    metadata: { ticketId, messageId: msg.id, isInternal } });

  revalidatePath(`/tickets/${ticketId}`);
  return { success: true, messageId: msg.id };
}

// ─── Bulk actions ─────────────────────────────────────────────────────────────

export async function bulkUpdateTickets(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };

  const idsRaw = formData.get("ticketIds") as string;
  const parsed = bulkActionSchema.safeParse({
    ticketIds:  idsRaw ? idsRaw.split(",") : [],
    action:     formData.get("action"),
    assigneeId: formData.get("assigneeId") || undefined,
    priority:   formData.get("priority") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { ticketIds, action, assigneeId, priority } = parsed.data;
  const now = new Date().toISOString();

  let update: Record<string, unknown> = { updated_at: now };

  switch (action) {
    case "resolve":    update.status = "resolved"; update.resolved_at = now; break;
    case "close":      update.status = "closed";   update.closed_at   = now; break;
    case "setPriority":
      if (!priority) return { error: "Priority required" };
      update.priority = priority;
      break;
    case "assign":
      if (!assigneeId) return { error: "Assignee required" };
      update.assignee_id = assigneeId;
      break;
    case "delete":
      if (!["owner", "admin"].includes(profile.role)) return { error: "Insufficient permissions" };
      const { error: delError } = await supabase.from("tickets").delete()
        .eq("org_id", profile.org_id).in("id", ticketIds);
      if (delError) return { error: delError.message };
      revalidatePath("/tickets");
      return { success: true, count: ticketIds.length };
  }

  const { error } = await supabase.from("tickets").update(update)
    .eq("org_id", profile.org_id).in("id", ticketIds);

  if (error) return { error: error.message };

  revalidatePath("/tickets");
  return { success: true, count: ticketIds.length };
}

// ─── Delete ticket ────────────────────────────────────────────────────────────

export async function deleteTicket(ticketId: string) {
  const supabase = await createClient();
  const { orgId, userId } = await getOrgId();

  const { error } = await supabase.from("tickets").delete()
    .eq("id", ticketId).eq("org_id", orgId);

  if (error) return { error: error.message };

  await logAuditEvent({ event: "ticket.deleted", orgId, userId, metadata: { ticketId } });
  revalidatePath("/tickets");
  redirect("/tickets");
}

// ─── Saved views ──────────────────────────────────────────────────────────────

export async function createSavedView(formData: FormData) {
  const supabase = await createClient();
  const { orgId, userId } = await getOrgId();

  const filtersRaw = formData.get("filters") as string;
  const parsed = savedViewSchema.safeParse({
    name:     formData.get("name"),
    filters:  filtersRaw ? JSON.parse(filtersRaw) : {},
    isShared: formData.get("isShared") === "true",
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase.from("saved_views").insert({
    org_id:    orgId,
    user_id:   userId,
    name:      parsed.data.name,
    filters:   parsed.data.filters,
    is_shared: parsed.data.isShared,
  });

  if (error) return { error: error.message };

  revalidatePath("/tickets");
  return { success: true };
}

export async function deleteSavedView(viewId: string) {
  const supabase = await createClient();
  await supabase.from("saved_views").delete().eq("id", viewId);
  revalidatePath("/tickets");
  return { success: true };
}
