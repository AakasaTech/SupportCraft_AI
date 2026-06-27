"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { sendNewTicketEmail } from "@/lib/resend";

// ─── Create ticket (portal) ───────────────────────────────────────────────────

export async function portalCreateTicket(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const title       = (formData.get("title")       as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priority    = (formData.get("priority")    as string) || "medium";
  const orgId       = (formData.get("orgId")       as string)?.trim();

  if (!title || title.length < 3) return { error: "Title must be at least 3 characters" };
  if (!description)               return { error: "Description is required" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const customer = customers.find((c) => c.org_id === orgId) ?? customers[0];
  const admin = createAdminClient();

  const { data: ticket, error: ticketError } = await admin
    .from("tickets")
    .insert({
      org_id:      customer.org_id,
      customer_id: customer.id,
      title,
      description,
      priority,
      status:  "new",
      source:  "portal",
    })
    .select("id, ticket_number")
    .single();

  if (ticketError) return { error: ticketError.message };

  // Insert description as first message
  try {
    await admin.from("ticket_messages").insert({
      ticket_id:   ticket.id,
      author_id:   null,
      content:     description,
      is_ai:       false,
      is_customer: true,
      is_internal: false,
    });
  } catch {
    await admin.from("ticket_messages").insert({
      ticket_id:   ticket.id,
      author_id:   null,
      content:     description,
      is_ai:       false,
      is_customer: true,
    });
  }

  // Notify first owner/admin in the org
  try {
    const { data: agents } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("org_id", customer.org_id)
      .in("role", ["owner", "admin"])
      .limit(1);

    if (agents?.[0]?.email) {
      await sendNewTicketEmail({
        to:           agents[0].email,
        agentName:    agents[0].full_name ?? "Team",
        ticketTitle:  title,
        ticketId:     ticket.id,
        customerName: customer.name ?? user.email ?? "Customer",
        ticketNumber: ticket.ticket_number ?? undefined,
      });
    }
  } catch {
    // Email failure is non-fatal
  }

  return { success: true, ticketId: ticket.id };
}

// ─── Update portal customer profile ──────────────────────────────────────────

export async function updatePortalProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1) return { error: "Name is required" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const admin       = createAdminClient();
  const customerIds = customers.map((c) => c.id);

  const { error } = await admin
    .from("customers")
    .update({ name })
    .in("id", customerIds);

  if (error) return { error: error.message };
  return { success: true };
}

// ─── Submit CSAT rating ───────────────────────────────────────────────────────

export async function submitTicketRating(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ticketId   = formData.get("ticketId")   as string;
  const customerId = formData.get("customerId") as string;
  const ratingRaw  = formData.get("rating")     as string;
  const comment    = (formData.get("comment")   as string)?.trim() || null;

  const rating = parseInt(ratingRaw, 10);
  if (!ticketId)              return { error: "Ticket ID required" };
  if (isNaN(rating) || rating < 1 || rating > 5) return { error: "Rating must be 1–5" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const customerIds = customers.map((c) => c.id);
  const admin       = createAdminClient();

  // Verify ticket belongs to this customer
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, status")
    .eq("id", ticketId)
    .in("customer_id", customerIds)
    .single();

  if (!ticket) return { error: "Ticket not found" };
  if (!["resolved", "closed"].includes(ticket.status)) {
    return { error: "Only resolved tickets can be rated" };
  }

  const { error } = await admin
    .from("ticket_ratings")
    .upsert({ ticket_id: ticketId, customer_id: customerId || null, rating, comment })
    .eq("ticket_id", ticketId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function portalReplyToTicket(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const ticketId = formData.get("ticketId") as string;
  const content  = (formData.get("content") as string)?.trim();

  if (!ticketId) return { error: "Ticket ID required" };
  if (!content)  return { error: "Reply cannot be empty" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const customerIds = customers.map((c) => c.id);
  const admin = createAdminClient();

  // Verify ticket belongs to this customer
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, title, ticket_number, customer_id, assignee_id, assignee:profiles!tickets_assignee_id_fkey(email, full_name)")
    .eq("id", ticketId)
    .in("customer_id", customerIds)
    .single();

  if (!ticket) return { error: "Ticket not found" };

  // Insert customer reply
  const insertPayload: Record<string, unknown> = {
    ticket_id:   ticketId,
    author_id:   null,
    content,
    is_ai:       false,
    is_customer: true,
  };

  // is_internal added in migration 003 — include if column exists
  try {
    const { error: msgError } = await admin
      .from("ticket_messages")
      .insert({ ...insertPayload, is_internal: false });
    if (msgError) throw msgError;
  } catch {
    const { error: msgError } = await admin
      .from("ticket_messages")
      .insert(insertPayload);
    if (msgError) return { error: msgError.message };
  }

  // Reopen ticket if it was pending / resolved
  await admin
    .from("tickets")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", ticketId)
    .in("status", ["pending", "resolved"]);

  // Notify assigned agent
  try {
    const assignee = ticket.assignee as { email?: string; full_name?: string } | null;
    if (assignee?.email) {
      const customer = customers.find((c) => c.id === ticket.customer_id);
      await sendNewTicketEmail({
        to:           assignee.email,
        agentName:    assignee.full_name ?? "Agent",
        ticketTitle:  ticket.title,
        ticketId:     ticket.id,
        customerName: customer?.name ?? user.email ?? "Customer",
        ticketNumber: ticket.ticket_number ?? undefined,
      });
    }
  } catch {
    // Email failure is non-fatal
  }

  return { success: true };
}
