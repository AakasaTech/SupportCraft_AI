import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getPlatformProvider, getOrgEmail } from "@/lib/email/platform-provider";
import { renderTemplate, buildDefaultVariables } from "@/lib/email/templates";
import { enqueueEmail } from "@/lib/email/queue";
import type { OutboundEmailMessage } from "@/lib/email/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("org_id, full_name")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

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
  const { data: settings } = await admin
    .from("email_settings")
    .select("tenant_slug, display_name, reply_to, signature_html")
    .eq("org_id", profile.org_id)
    .single();

  if (!settings?.tenant_slug) {
    return NextResponse.json({ error: "Support email address not configured. Set a tenant slug in Settings → Email." }, { status: 400 });
  }

  // From address is always slug@supportcraft.aakasa.dev
  const fromAddress = getOrgEmail(settings.tenant_slug);
  const toAddresses = Array.isArray(to) ? to : [to];

  // Render template if provided
  let finalHtml = html as string | undefined;
  let finalText = text as string | undefined;
  if (templateSlug) {
    const vars = buildDefaultVariables({
      agentName:        profile.full_name ?? "Support Team",
      organizationName: settings.display_name ?? "",
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
  if (settings.signature_html && finalHtml) {
    finalHtml = `${finalHtml}<br/><br/><div class="email-signature">${settings.signature_html}</div>`;
  }

  // Queue mode — defer sending to background processor
  if (queued) {
    const queueId = await enqueueEmail({
      orgId:       profile.org_id,
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
    from:       { address: fromAddress, name: settings.display_name ?? undefined },
    to:         toAddresses.map((a: string) => ({ address: a })),
    cc:         cc ? (Array.isArray(cc) ? cc : [cc]).map((a: string) => ({ address: a })) : undefined,
    replyTo:    settings.reply_to ?? fromAddress, // reply-to defaults to the same address
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
  const { data: emailMsg } = await admin
    .from("email_messages")
    .insert({
      org_id:             profile.org_id,
      ticket_id:          ticketId ?? null,
      direction:          "outbound",
      message_id:         result.messageId,
      in_reply_to:        replyToMessageId ?? null,
      references:         references ?? [],
      from_address:       fromAddress,
      to_address:         toAddresses.join(","),
      subject,
      body_html:          finalHtml,
      body_plain:         finalText,
      provider:           process.env.EMAIL_PROVIDER ?? "smtp",
      provider_message_id: result.messageId,
      status:             "sent",
      sent_at:            new Date().toISOString(),
    })
    .select("id")
    .single();

  if (emailMsg) {
    await admin.from("email_delivery_events")
      .insert({ email_message_id: emailMsg.id, event_type: "sent" });
  }

  return NextResponse.json({ success: true, messageId: result.messageId, emailMessageId: emailMsg?.id });
}
