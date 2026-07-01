import { createAdminClient } from "@/lib/supabase/server";
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
  const admin = createAdminClient();

  // ── Find or create customer ───────────────────────────────────────────────
  let { data: customer } = await admin
    .from("customers")
    .select("id")
    .eq("org_id", params.orgId)
    .eq("email", params.fromAddress)
    .single();

  if (!customer) {
    const { data: newCustomer } = await admin
      .from("customers")
      .insert({
        org_id: params.orgId,
        email:  params.fromAddress,
        name:   params.fromName ?? params.fromAddress.split("@")[0],
      })
      .select("id")
      .single();
    customer = newCustomer;
  }

  if (!customer) throw new Error("Failed to resolve customer");

  // ── Create ticket ─────────────────────────────────────────────────────────
  const { data: ticket } = await admin
    .from("tickets")
    .insert({
      org_id:      params.orgId,
      customer_id: customer.id,
      title:       params.subject.slice(0, 200),
      description: params.bodyPlain?.slice(0, 2000) ?? "(no content)",
      status:      "open",
      priority:    "medium",
      channel:     params.channel,
    })
    .select("id, ticket_number")
    .single();

  if (!ticket) throw new Error("Failed to create ticket");

  // ── Record email message ─────────────────────────────────────────────────
  const { data: emailMsg } = await admin
    .from("email_messages")
    .insert({
      org_id:             params.orgId,
      ticket_id:          ticket.id,
      direction:          "inbound",
      message_id:         params.messageId,
      in_reply_to:        params.inReplyTo,
      references:         params.references,
      from_address:       params.fromAddress,
      to_address:         params.toAddress,
      subject:            params.subject,
      body_plain:         params.bodyPlain,
      body_html:          params.bodyHtml,
      sanitized_body_html: params.sanitizedHtml,
      status:             "delivered",
      raw_inbound_id:     params.rawInboundId,
    })
    .select("id")
    .single();

  if (!emailMsg) throw new Error("Failed to record email message");

  // ── Add initial message to ticket thread ─────────────────────────────────
  await admin.from("ticket_messages").insert({
    ticket_id:   ticket.id,
    content:     params.bodyPlain?.slice(0, 5000) ?? "(no content)",
    is_customer: true,
    is_ai:       false,
    is_internal: false,
  });

  // Update ticket to link the source email
  await admin
    .from("tickets")
    .update({ source_email_message_id: emailMsg.id })
    .eq("id", ticket.id);

  // Send acknowledgement to customer (fire-and-forget)
  const [{ data: emailSettings }, { data: ackTemplate }] = await Promise.all([
    admin.from("email_settings").select("tenant_slug, display_name").eq("org_id", params.orgId).single(),
    admin.from("email_templates").select("subject, body_plain, body_html, is_active")
      .eq("org_id", params.orgId).eq("slug", "ticket-acknowledgement").single(),
  ]);

  if (emailSettings?.tenant_slug && ackTemplate?.is_active !== false) {
    const ticketNum = ticket.ticket_number ?? ticket.id.slice(0, 8).toUpperCase();
    const orgName   = emailSettings.display_name ?? emailSettings.tenant_slug;
    const vars      = {
      customer_name:      params.fromName ?? params.fromAddress.split("@")[0],
      ticket_number:      ticketNum,
      ticket_subject:     params.subject,
      organization_name:  orgName,
      support_email:      getOrgEmail(emailSettings.tenant_slug),
    };

    const subject = ackTemplate?.subject
      ? renderVariables(ackTemplate.subject, vars)
      : `[Ticket #${ticketNum}] We received your request: ${params.subject}`;

    const bodyPlain = ackTemplate?.body_plain
      ? renderVariables(ackTemplate.body_plain, vars)
      : undefined;

    const bodyHtml = ackTemplate?.body_html
      ? renderVariables(ackTemplate.body_html, vars)
      : undefined;

    sendTicketAcknowledgementEmail({
      to:           params.fromAddress,
      customerName: vars.customer_name,
      ticketNumber: ticketNum,
      subject,
      bodyPlain,
      bodyHtml,
      from:         getOrgEmail(emailSettings.tenant_slug),
      displayName:  orgName,
    }).catch(err => console.error("Ack email failed:", err));
  }

  return { ticketId: ticket.id, customerId: customer.id, emailMessageId: emailMsg.id };
}

export async function addReplyToTicket(
  params: AddReplyToTicketParams
): Promise<{ emailMessageId: string }> {
  const admin = createAdminClient();

  // Get sender customer id
  const { data: fromCustomer } = await admin
    .from("customers")
    .select("id")
    .eq("org_id", params.orgId)
    .single();

  // Record email message
  const { data: emailMsg } = await admin
    .from("email_messages")
    .insert({
      org_id:             params.orgId,
      ticket_id:          params.ticketId,
      direction:          "inbound",
      message_id:         params.messageId,
      in_reply_to:        params.inReplyTo,
      references:         params.references,
      from_address:       params.fromAddress,
      to_address:         params.toAddress,
      subject:            "(reply)",
      body_plain:         params.bodyPlain,
      sanitized_body_html: params.sanitizedHtml,
      status:             "delivered",
      raw_inbound_id:     params.rawInboundId,
    })
    .select("id")
    .single();

  if (!emailMsg) throw new Error("Failed to record reply email");

  // Add to ticket thread
  await admin.from("ticket_messages").insert({
    ticket_id:   params.ticketId,
    content:     params.bodyPlain?.slice(0, 5000) ?? "(no content)",
    is_customer: true,
    is_ai:       false,
    is_internal: false,
  });

  // Reopen if closed/resolved
  await admin
    .from("tickets")
    .update({ status: "open", updated_at: new Date().toISOString() })
    .eq("id", params.ticketId)
    .in("status", ["resolved", "closed"]);

  return { emailMessageId: emailMsg.id };
}
