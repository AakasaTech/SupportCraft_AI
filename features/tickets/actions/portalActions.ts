"use server";

import { getAuthUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { sendNewTicketEmail } from "@/lib/resend";

// ─── Create ticket (portal) ───────────────────────────────────────────────────

export async function portalCreateTicket(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const title       = (formData.get("title")       as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const priority     = ((formData.get("priority")   as string) || "medium") as "low" | "medium" | "high" | "urgent";
  const orgId       = (formData.get("orgId")       as string)?.trim();

  if (!title || title.length < 3) return { error: "Title must be at least 3 characters" };
  if (!description)               return { error: "Description is required" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const customer = customers.find((c) => c.org_id === orgId) ?? customers[0];

  const ticket = await prisma.ticket.create({
    data: {
      organizationId: customer.org_id,
      customerId:     customer.id,
      title,
      description,
      priority,
      status: "new",
      source: "portal",
    },
    select: { id: true, ticketNumber: true },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId:   ticket.id,
      authorId:   null,
      content:    description,
      isAi:       false,
      isCustomer: true,
      isInternal: false,
    },
  });

  // Notify first owner/admin in the org
  try {
    const agent = await prisma.profile.findFirst({
      where:  { organizationId: customer.org_id, role: { in: ["owner", "admin"] } },
      select: { email: true, fullName: true },
    });

    if (agent?.email) {
      await sendNewTicketEmail({
        to:           agent.email,
        agentName:    agent.fullName ?? "Team",
        ticketTitle:  title,
        ticketId:     ticket.id,
        customerName: customer.name ?? user.email ?? "Customer",
        ticketNumber: ticket.ticketNumber ?? undefined,
      });
    }
  } catch {
    // Email failure is non-fatal
  }

  return { success: true, ticketId: ticket.id };
}

// ─── Update portal customer profile ──────────────────────────────────────────

export async function updatePortalProfile(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const name = (formData.get("name") as string)?.trim();
  if (!name || name.length < 1) return { error: "Name is required" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const customerIds = customers.map((c) => c.id);

  await prisma.customer.updateMany({
    where: { id: { in: customerIds } },
    data:  { name },
  });

  return { success: true };
}

// ─── Submit CSAT rating ───────────────────────────────────────────────────────

export async function submitTicketRating(formData: FormData) {
  const user = await getAuthUser();
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

  // Verify ticket belongs to this customer
  const ticket = await prisma.ticket.findFirst({
    where:  { id: ticketId, customerId: { in: customerIds } },
    select: { id: true, status: true },
  });

  if (!ticket) return { error: "Ticket not found" };
  if (!["resolved", "closed"].includes(ticket.status)) {
    return { error: "Only resolved tickets can be rated" };
  }

  await prisma.ticketRating.upsert({
    where:  { ticketId },
    create: { ticketId, customerId: customerId || null, rating, comment },
    update: { customerId: customerId || null, rating, comment },
  });

  return { success: true };
}

export async function portalReplyToTicket(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Not authenticated" };

  const ticketId = formData.get("ticketId") as string;
  const content  = (formData.get("content") as string)?.trim();

  if (!ticketId) return { error: "Ticket ID required" };
  if (!content)  return { error: "Reply cannot be empty" };

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) return { error: "No customer account found" };

  const customerIds = customers.map((c) => c.id);

  // Verify ticket belongs to this customer
  const ticket = await prisma.ticket.findFirst({
    where:  { id: ticketId, customerId: { in: customerIds } },
    select: {
      id: true, title: true, ticketNumber: true, customerId: true,
      assignee: { select: { email: true, fullName: true } },
    },
  });

  if (!ticket) return { error: "Ticket not found" };

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId:   null,
      content,
      isAi:       false,
      isCustomer: true,
      isInternal: false,
    },
  });

  // Reopen ticket if it was pending / resolved
  await prisma.ticket.updateMany({
    where: { id: ticketId, status: { in: ["pending", "resolved"] } },
    data:  { status: "open" },
  });

  // Notify assigned agent
  try {
    if (ticket.assignee?.email) {
      const customer = customers.find((c) => c.id === ticket.customerId);
      await sendNewTicketEmail({
        to:           ticket.assignee.email,
        agentName:    ticket.assignee.fullName ?? "Agent",
        ticketTitle:  ticket.title,
        ticketId:     ticket.id,
        customerName: customer?.name ?? user.email ?? "Customer",
        ticketNumber: ticket.ticketNumber ?? undefined,
      });
    }
  } catch {
    // Email failure is non-fatal
  }

  return { success: true };
}
