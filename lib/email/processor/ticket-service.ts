import { prisma } from "@/lib/prisma";
import type { TicketChannel } from "@/lib/generated/prisma/client";
import { sendTicketAcknowledgementEmail } from "@/lib/resend";
import { getOrgEmail } from "@/lib/email/platform-provider";
import { renderVariables } from "@/lib/email/templates/variables";

interface CreateTicketFromEmailParams {
  orgId:        string;
  toAddress:    string;
  fromAddress:  string;
  fromName:     string | null;
  subject:      string;
  bodyPlain:    string | null;
  bodyHtml:     string | null;
  sanitizedHtml: string | null;
  messageId:    string;
  inReplyTo:    string | null;
  references:   string[];
  rawInboundId: string | null;
  channel:      string;
}

interface AddReplyToTicketParams {
  ticketId:     string;
  orgId:        string;
  toAddress:    string;
  fromAddress:  string;
  bodyPlain:    string | null;
  sanitizedHtml: string | null;
  messageId:    string;
  inReplyTo:    string | null;
  references:   string[];
  rawInboundId: string | null;
}

export async function createTicketFromEmail(
  params: CreateTicketFromEmailParams
): Promise<{ ticketId: string; customerId: string; emailMessageId: string }> {
  // ── Find or create customer ───────────────────────────────────────────────
  let customer = await prisma.customer.findFirst({
    where:  { organizationId: params.orgId, email: params.fromAddress },
    select: { id: true },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        organizationId: params.orgId,
        email: params.fromAddress,
        name:  params.fromName ?? params.fromAddress.split("@")[0],
      },
      select: { id: true },
    });
  }

  // ── Create ticket ─────────────────────────────────────────────────────────
  const ticket = await prisma.ticket.create({
    data: {
      organizationId: params.orgId,
      customerId:     customer.id,
      title:       params.subject.slice(0, 200),
      description: params.bodyPlain?.slice(0, 2000) ?? "(no content)",
      status:      "open",
      priority:    "medium",
      channel:     params.channel as TicketChannel,
    },
    select: { id: true, ticketNumber: true },
  });

  // ── Record email message ─────────────────────────────────────────────────
  const emailMsg = await prisma.emailMessage.create({
    data: {
      organizationId: params.orgId,
      ticketId:          ticket.id,
      direction:         "inbound",
      messageId:         params.messageId,
      inReplyTo:         params.inReplyTo,
      messageReferences: params.references,
      fromAddress:       params.fromAddress,
      toAddress:         params.toAddress,
      subject:           params.subject,
      bodyPlain:         params.bodyPlain,
      bodyHtml:          params.bodyHtml,
      sanitizedBodyHtml: params.sanitizedHtml,
      status:            "delivered",
      rawInboundId:      params.rawInboundId,
    },
    select: { id: true },
  });

  // ── Add initial message to ticket thread ─────────────────────────────────
  await prisma.ticketMessage.create({
    data: {
      ticketId:   ticket.id,
      content:    params.bodyPlain?.slice(0, 5000) ?? "(no content)",
      isCustomer: true,
      isAi:       false,
      isInternal: false,
    },
  });

  // Update ticket to link the source email
  await prisma.ticket.update({
    where: { id: ticket.id },
    data:  { sourceEmailMessageId: emailMsg.id },
  });

  // Send acknowledgement to customer (fire-and-forget)
  const [emailSettings, ackTemplate] = await Promise.all([
    prisma.emailSettings.findUnique({
      where:  { organizationId: params.orgId },
      select: { tenantSlug: true, displayName: true },
    }),
    prisma.emailTemplate.findFirst({
      where:  { organizationId: params.orgId, slug: "ticket-acknowledgement" },
      select: { subject: true, bodyPlain: true, bodyHtml: true, isActive: true },
    }),
  ]);

  if (emailSettings?.tenantSlug && ackTemplate?.isActive !== false) {
    const ticketNum = ticket.ticketNumber ?? ticket.id.slice(0, 8).toUpperCase();
    const orgName   = emailSettings.displayName ?? emailSettings.tenantSlug;
    const vars      = {
      customer_name:      params.fromName ?? params.fromAddress.split("@")[0],
      ticket_number:      ticketNum,
      ticket_subject:     params.subject,
      organization_name:  orgName,
      support_email:      getOrgEmail(emailSettings.tenantSlug),
    };

    const subject = ackTemplate?.subject
      ? renderVariables(ackTemplate.subject, vars)
      : `[Ticket #${ticketNum}] ${params.subject}`;

    const bodyPlain = ackTemplate?.bodyPlain
      ? renderVariables(ackTemplate.bodyPlain, vars)
      : undefined;

    const bodyHtml = ackTemplate?.bodyHtml
      ? renderVariables(ackTemplate.bodyHtml, vars)
      : undefined;

    sendTicketAcknowledgementEmail({
      to:           params.fromAddress,
      customerName: vars.customer_name,
      ticketNumber: ticketNum,
      subject,
      bodyPlain,
      bodyHtml,
      from:         getOrgEmail(emailSettings.tenantSlug),
      displayName:  orgName,
    }).catch(err => console.error("Ack email failed:", err));
  }

  return { ticketId: ticket.id, customerId: customer.id, emailMessageId: emailMsg.id };
}

export async function addReplyToTicket(
  params: AddReplyToTicketParams
): Promise<{ emailMessageId: string }> {
  // Record email message
  const emailMsg = await prisma.emailMessage.create({
    data: {
      organizationId: params.orgId,
      ticketId:          params.ticketId,
      direction:         "inbound",
      messageId:         params.messageId,
      inReplyTo:         params.inReplyTo,
      messageReferences: params.references,
      fromAddress:       params.fromAddress,
      toAddress:         params.toAddress,
      subject:           "(reply)",
      bodyPlain:         params.bodyPlain,
      sanitizedBodyHtml: params.sanitizedHtml,
      status:            "delivered",
      rawInboundId:      params.rawInboundId,
    },
    select: { id: true },
  });

  // Add to ticket thread
  await prisma.ticketMessage.create({
    data: {
      ticketId:   params.ticketId,
      content:    params.bodyPlain?.slice(0, 5000) ?? "(no content)",
      isCustomer: true,
      isAi:       false,
      isInternal: false,
    },
  });

  // Reopen if closed/resolved
  await prisma.ticket.updateMany({
    where: { id: params.ticketId, status: { in: ["resolved", "closed"] } },
    data:  { status: "open" },
  });

  return { emailMessageId: emailMsg.id };
}
