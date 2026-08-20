import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { getPlatformProvider, getOrgEmail } from "@/lib/email/platform-provider";
import { renderTemplate, buildDefaultVariables } from "@/lib/email/templates";
import { enqueueEmail } from "@/lib/email/queue";
import type { OutboundEmailMessage } from "@/lib/email/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const {
    to,
    cc,
    subject,
    html,
    text,
    templateSlug,
    templateVars,
    ticketId,
    replyToMessageId,
    references,
    queued    = false,
    priority  = 5,
  } = body;

  if (!to || !subject) {
    return NextResponse.json({ error: "to and subject are required" }, { status: 400 });
  }

  // Get org email settings (for display name, slug, signature, reply-to)
  const settings = await prisma.emailSettings.findUnique({
    where:  { organizationId: user.profile.organizationId },
    select: { tenantSlug: true, displayName: true, replyTo: true, signatureHtml: true },
  });

  if (!settings?.tenantSlug) {
    return NextResponse.json({ error: "Support email address not configured. Set a tenant slug in Settings → Email." }, { status: 400 });
  }

  // From address is always slug@supportcraft.aakasa.dev
  const fromAddress = getOrgEmail(settings.tenantSlug);
  const toAddresses = Array.isArray(to) ? to : [to];

  // Render template if provided
  let finalHtml = html as string | undefined;
  let finalText = text as string | undefined;
  if (templateSlug) {
    const vars = buildDefaultVariables({
      agentName:        user.profile.fullName ?? "Support Team",
      organizationName: settings.displayName ?? "",
      supportEmail:     fromAddress,
      ...templateVars,
    });
    const rendered = await renderTemplate(templateSlug as string, vars);
    if (rendered) {
      finalHtml = rendered.html;
      finalText = rendered.plain;
    }
  }

  // Append org signature
  if (settings.signatureHtml && finalHtml) {
    finalHtml = `${finalHtml}<br/><br/><div class="email-signature">${settings.signatureHtml}</div>`;
  }

  // Queue mode — defer sending to background processor
  if (queued) {
    const queueId = await enqueueEmail({
      orgId:       user.profile.organizationId,
      toAddresses,
      ccAddresses: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
      fromAddress,
      subject,
      bodyHtml:    finalHtml,
      bodyPlain:   finalText,
      templateSlug,
      templateVars,
      priority,
      ticketId:    ticketId ?? null,
    });
    return NextResponse.json({ queued: true, queueId });
  }

  // Send immediately via platform provider
  const provider = getPlatformProvider();

  const msg: OutboundEmailMessage = {
    from:       { address: fromAddress, name: settings.displayName ?? undefined },
    to:         toAddresses.map((a: string) => ({ address: a })),
    cc:         cc ? (Array.isArray(cc) ? cc : [cc]).map((a: string) => ({ address: a })) : undefined,
    replyTo:    settings.replyTo ?? fromAddress, // reply-to defaults to the same address
    subject,
    html:       finalHtml,
    text:       finalText,
    inReplyTo:  replyToMessageId,
    references: references ?? [],
  };

  const result = await provider.send(msg);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // Record in email_messages
  const emailMsg = await prisma.emailMessage.create({
    data: {
      organizationId: user.profile.organizationId,
      ticketId:          ticketId ?? null,
      direction:         "outbound",
      messageId:         result.messageId,
      inReplyTo:         replyToMessageId ?? null,
      messageReferences: references ?? [],
      fromAddress,
      toAddress:         toAddresses.join(","),
      subject,
      bodyHtml:          finalHtml,
      bodyPlain:         finalText,
      provider:          process.env.EMAIL_PROVIDER ?? "smtp",
      providerMessageId: result.messageId,
      status:            "sent",
      sentAt:            new Date(),
    },
    select: { id: true },
  });

  await prisma.emailDeliveryEvent.create({
    data: { emailMessageId: emailMsg.id, eventType: "sent" },
  });

  return NextResponse.json({ success: true, messageId: result.messageId, emailMessageId: emailMsg.id });
}
