import { sendEmail, getEmailFrom } from "@/lib/email/mailer";

const APP_NAME = "SupportCraft AI";

// ─── Invitation ───────────────────────────────────────────────────────────────

export interface InvitationEmailParams {
  to:          string;
  inviterName: string;
  orgName:     string;
  token:       string;
  role:        string;
}

export async function sendInvitationEmail(params: InvitationEmailParams) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/invitations/accept?token=${params.token}`;
  const from      = `${APP_NAME} <${getEmailFrom()}>`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a1a1a;">You're invited to ${APP_NAME}</h2>
      <p style="color:#555;">
        <strong>${params.inviterName}</strong> has invited you to join
        <strong>${params.orgName}</strong> as a <strong>${params.role}</strong>.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
        Accept Invitation
      </a>
      <p style="color:#999;font-size:13px;">This invitation expires in 7 days.</p>
      <p style="color:#999;font-size:12px;">
        If you can't click the button, copy this link:<br>${inviteUrl}
      </p>
    </div>
  `;

  const text = `You're invited to join ${params.orgName} on ${APP_NAME} as a ${params.role}.\n\nAccept here: ${inviteUrl}\n\nThis invitation expires in 7 days.`;

  await sendEmail({ from, to: params.to, subject: `${params.inviterName} invited you to join ${params.orgName} on ${APP_NAME}`, html, text });
}

// ─── New ticket assigned ──────────────────────────────────────────────────────

export interface NewTicketEmailParams {
  to:           string;
  agentName:    string;
  ticketTitle:  string;
  ticketId:     string;
  customerName: string;
  ticketNumber?: string;
}

export async function sendNewTicketEmail(params: NewTicketEmailParams) {
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${params.ticketId}`;
  const from      = `${APP_NAME} <${getEmailFrom()}>`;
  const ref       = params.ticketNumber ? ` (${params.ticketNumber})` : "";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a1a1a;">New ticket assigned to you</h2>
      <p style="color:#555;">Hi ${params.agentName},</p>
      <p style="color:#555;">
        A new ticket from <strong>${params.customerName}</strong> has been assigned to you:
      </p>
      <div style="background:#f5f5f5;border-left:4px solid #6d28d9;padding:16px;border-radius:4px;margin:16px 0;">
        <strong>${params.ticketTitle}</strong>${ref}
      </div>
      <a href="${ticketUrl}"
         style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;
                border-radius:8px;text-decoration:none;font-weight:600;">
        View Ticket
      </a>
    </div>
  `;

  const text = `Hi ${params.agentName},\n\nA new ticket from ${params.customerName} has been assigned to you:\n\n${params.ticketTitle}${ref}\n\n${ticketUrl}`;

  await sendEmail({ from, to: params.to, subject: `New ticket assigned: ${params.ticketTitle}`, html, text });
}

// ─── Ticket acknowledgement (to customer on inbound email) ───────────────────

export interface TicketAcknowledgementEmailParams {
  to:           string;
  customerName: string;
  ticketNumber: string;  // e.g. SUP-1003
  subject:      string;  // already rendered (includes ticket number)
  from:         string;
  displayName:  string;
  bodyPlain?:   string;
  bodyHtml?:    string;
}

export async function sendTicketAcknowledgementEmail(params: TicketAcknowledgementEmailParams) {
  const ticketRef = `[Ticket #${params.ticketNumber}]`;
  const fromLine  = `${params.displayName} Support <${params.from}>`;

  const html = params.bodyHtml ?? `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h2 style="color:#1a1a1a;">We received your request</h2>
      <p style="color:#555;">Hi ${params.customerName},</p>
      <p style="color:#555;">
        Thank you for contacting support. We've created a ticket for your request and our team will get back to you shortly.
      </p>
      <div style="background:#f5f5f5;border-left:4px solid #6d28d9;padding:16px;border-radius:4px;margin:16px 0;">
        <p style="margin:0;color:#333;font-size:13px;">Ticket reference</p>
        <p style="margin:4px 0 0;color:#1a1a1a;font-weight:600;font-size:18px;">${ticketRef}</p>
      </div>
      <p style="color:#555;">You can reply directly to this email to add more information to your ticket.</p>
      <p style="color:#999;font-size:12px;margin-top:24px;">
        Please keep the ticket reference <strong>${ticketRef}</strong> in the subject line when replying.
      </p>
    </div>
  `;

  const text = params.bodyPlain ??
    `Hi ${params.customerName},\n\nThank you for contacting support. We've received your request.\n\nTicket reference: ${ticketRef}\n\nYou can reply directly to this email to add more information.\n\nPlease keep the reference ${ticketRef} in the subject line when replying.`;

  await sendEmail({ from: fromLine, to: params.to, subject: params.subject, html, text });
}

// ─── Ticket reply (to customer) ───────────────────────────────────────────────

export interface TicketReplyEmailParams {
  to:             string;
  customerName:   string;
  agentName:      string;
  ticketTitle:    string;
  replyContent:   string;
  ticketId:       string;
  ticketNumber?:  string;
  // Org email — defaults to platform email when absent
  fromAddress?:   string;  // e.g. xbit@supportcraft.aakasa.dev
  displayName?:   string;  // e.g. "Xbit"
  // Email threading headers
  outboundMessageId?: string;  // Message-ID we're sending with (no angle brackets)
  inReplyTo?:     string;      // message_id of the last email in this thread (no angle brackets)
  references?:    string[];    // full chain of message_ids (no angle brackets)
}

export async function sendTicketReplyEmail(params: TicketReplyEmailParams) {
  const ticketRef = params.ticketNumber ? `[Ticket #${params.ticketNumber}]` : "";
  const subject   = ticketRef
    ? `Re: ${ticketRef} ${params.ticketTitle}`
    : `Re: ${params.ticketTitle}`;

  const from = params.fromAddress && params.displayName
    ? `${params.displayName} Support <${params.fromAddress}>`
    : `${APP_NAME} <${getEmailFrom()}>`;

  const headers: Record<string, string> = {};
  if (params.outboundMessageId) headers["Message-ID"]  = `<${params.outboundMessageId}>`;
  if (params.inReplyTo)         headers["In-Reply-To"] = `<${params.inReplyTo}>`;
  if (params.references?.length) {
    headers["References"] = params.references.map(r => `<${r}>`).join(" ");
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <p style="color:#555;">Hi ${params.customerName},</p>
      <p style="color:#555;">${params.agentName} replied to your support ticket ${ticketRef}:</p>
      <div style="background:#f9f9f9;border:1px solid #e0e0e0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="color:#333;white-space:pre-wrap;margin:0;">${params.replyContent}</p>
      </div>
      <p style="color:#999;font-size:12px;margin-top:24px;">
        You're receiving this because you submitted a support request.<br>
        Reply to this email to respond to the ticket.
      </p>
    </div>
  `;

  const text = `Hi ${params.customerName},\n\n${params.agentName} replied to your support ticket ${ticketRef}:\n\n${params.replyContent}\n\nReply to this email to respond to the ticket.`;

  await sendEmail({ from, to: params.to, subject, html, text, headers: Object.keys(headers).length ? headers : undefined });
}
