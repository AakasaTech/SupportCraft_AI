import { createAdminClient } from "@/lib/supabase/server";
import { getPlatformProvider, getOrgEmail } from "../platform-provider";
import type { OutboundEmailMessage } from "../types";

export async function enqueueEmail(params: {
  orgId:        string;
  toAddresses:  string[];
  ccAddresses?: string[];
  fromAddress?: string | null;
  replyTo?:     string | null;
  subject:      string;
  bodyHtml?:    string | null;
  bodyPlain?:   string | null;
  templateSlug?: string | null;
  templateVars?: Record<string, string>;
  priority?:    number;
  scheduledAt?: string | null;
  ticketId?:    string | null;
  metadata?:    Record<string, unknown>;
}): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("email_queue")
    .insert({
      org_id:        params.orgId,
      to_addresses:  params.toAddresses,
      cc_addresses:  params.ccAddresses ?? [],
      from_address:  params.fromAddress ?? null,
      reply_to:      params.replyTo ?? null,
      subject:       params.subject,
      body_html:     params.bodyHtml ?? null,
      body_plain:    params.bodyPlain ?? null,
      template_slug: params.templateSlug ?? null,
      template_vars: params.templateVars ?? {},
      priority:      params.priority ?? 5,
      scheduled_at:  params.scheduledAt ?? null,
      ticket_id:     params.ticketId ?? null,
      metadata:      params.metadata ?? {},
      status:        "pending",
    })
    .select("id")
    .single();

  return data?.id ?? null;
}

/** Process the next batch of pending queue items. Call from a cron or API route. */
export async function processQueue(batchSize = 10): Promise<{ processed: number; errors: number }> {
  const admin = createAdminClient();

  // Claim pending items atomically
  const now = new Date().toISOString();
  const { data: items } = await admin
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .or(`scheduled_at.is.null,scheduled_at.lte.${now}`)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (!items?.length) return { processed: 0, errors: 0 };

  // Mark as processing
  const ids = items.map(i => i.id);
  await admin.from("email_queue").update({ status: "processing" }).in("id", ids);

  let processed = 0;
  let errors    = 0;

  for (const item of items) {
    try {
      // Get org email settings
      const { data: settings } = await admin
        .from("email_settings")
        .select("tenant_slug, display_name, reply_to")
        .eq("org_id", item.org_id)
        .single();

      if (!settings?.tenant_slug) throw new Error("Tenant slug not configured for org");

      const provider    = getPlatformProvider();
      const fromAddress = item.from_address ?? getOrgEmail(settings.tenant_slug);

      const msg: OutboundEmailMessage = {
        from: {
          address: fromAddress,
          name:    settings.display_name ?? undefined,
        },
        to:      item.to_addresses.map((a: string) => ({ address: a })),
        cc:      item.cc_addresses?.map((a: string) => ({ address: a })),
        replyTo: item.reply_to ?? settings.reply_to ?? fromAddress,
        subject: item.subject,
        html:    item.body_html ?? undefined,
        text:    item.body_plain ?? undefined,
      };

      const result = await provider.send(msg);

      if (result.success) {
        // Create email_messages record
        const { data: emailMsg } = await admin
          .from("email_messages")
          .insert({
            org_id:              item.org_id,
            ticket_id:           item.ticket_id,
            direction:           "outbound",
            message_id:          result.messageId,
            from_address:        fromAddress,
            to_address:          item.to_addresses.join(","),
            subject:             item.subject,
            body_html:           item.body_html,
            body_plain:          item.body_plain,
            provider:            process.env.EMAIL_PROVIDER ?? "smtp",
            provider_message_id: result.messageId,
            status:              "sent",
            sent_at:             new Date().toISOString(),
          })
          .select("id")
          .single();

        if (emailMsg) {
          await admin
            .from("email_delivery_events")
            .insert({ email_message_id: emailMsg.id, event_type: "sent" });
          await admin
            .from("email_queue")
            .update({ status: "sent", email_message_id: emailMsg.id, processed_at: new Date().toISOString() })
            .eq("id", item.id);
        }
        processed++;
      } else {
        throw new Error(result.error ?? "Send failed");
      }

    } catch (err) {
      errors++;
      const retryCount = (item.retry_count ?? 0) + 1;
      const maxRetries = item.max_retries ?? 3;
      const backoffMs  = Math.min(1000 * Math.pow(2, retryCount), 3_600_000);
      const nextRetry  = new Date(Date.now() + backoffMs).toISOString();

      await admin.from("email_queue").update({
        status:        retryCount >= maxRetries ? "dead" : "pending",
        retry_count:   retryCount,
        next_retry_at: retryCount < maxRetries ? nextRetry : null,
        error_message: String(err),
      }).eq("id", item.id);
    }
  }

  return { processed, errors };
}
