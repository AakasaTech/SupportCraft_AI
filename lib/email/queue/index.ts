import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
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
  const item = await prisma.emailQueue.create({
    data: {
      organizationId: params.orgId,
      toAddresses:  params.toAddresses,
      ccAddresses:  params.ccAddresses ?? [],
      fromAddress:  params.fromAddress ?? null,
      replyTo:      params.replyTo ?? null,
      subject:      params.subject,
      bodyHtml:     params.bodyHtml ?? null,
      bodyPlain:    params.bodyPlain ?? null,
      templateSlug: params.templateSlug ?? null,
      templateVars: params.templateVars ?? {},
      priority:     params.priority ?? 5,
      scheduledAt:  params.scheduledAt ? new Date(params.scheduledAt) : null,
      ticketId:     params.ticketId ?? null,
      metadata:     (params.metadata ?? {}) as Prisma.InputJsonValue,
      status:       "pending",
    },
    select: { id: true },
  });

  return item.id;
}

/** Process the next batch of pending queue items. Call from a cron or API route. */
export async function processQueue(batchSize = 10): Promise<{ processed: number; errors: number }> {
  const now = new Date();

  // Claim pending items atomically
  const items = await prisma.emailQueue.findMany({
    where: {
      status: "pending",
      AND: [
        { OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] },
        { OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] },
      ],
    },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: batchSize,
  });

  if (!items.length) return { processed: 0, errors: 0 };

  // Mark as processing
  const ids = items.map(i => i.id);
  await prisma.emailQueue.updateMany({ where: { id: { in: ids } }, data: { status: "processing" } });

  let processed = 0;
  let errors    = 0;

  for (const item of items) {
    try {
      // Get org email settings
      const settings = await prisma.emailSettings.findUnique({
        where:  { organizationId: item.organizationId },
        select: { tenantSlug: true, displayName: true, replyTo: true },
      });

      if (!settings?.tenantSlug) throw new Error("Tenant slug not configured for org");

      const provider    = getPlatformProvider();
      const fromAddress = item.fromAddress ?? getOrgEmail(settings.tenantSlug);

      const msg: OutboundEmailMessage = {
        from: {
          address: fromAddress,
          name:    settings.displayName ?? undefined,
        },
        to:      item.toAddresses.map((a) => ({ address: a })),
        cc:      item.ccAddresses?.map((a) => ({ address: a })),
        replyTo: item.replyTo ?? settings.replyTo ?? fromAddress,
        subject: item.subject,
        html:    item.bodyHtml ?? undefined,
        text:    item.bodyPlain ?? undefined,
      };

      const result = await provider.send(msg);

      if (result.success) {
        // Create email_messages record
        const emailMsg = await prisma.emailMessage.create({
          data: {
            organizationId:     item.organizationId,
            ticketId:           item.ticketId,
            direction:          "outbound",
            messageId:          result.messageId,
            fromAddress:        fromAddress,
            toAddress:          item.toAddresses.join(","),
            subject:            item.subject,
            bodyHtml:           item.bodyHtml,
            bodyPlain:          item.bodyPlain,
            provider:           process.env.EMAIL_PROVIDER ?? "smtp",
            providerMessageId:  result.messageId,
            status:             "sent",
            sentAt:             new Date(),
          },
          select: { id: true },
        });

        await prisma.emailDeliveryEvent.create({
          data: { emailMessageId: emailMsg.id, eventType: "sent" },
        });
        await prisma.emailQueue.update({
          where: { id: item.id },
          data:  { status: "sent", emailMessageId: emailMsg.id, processedAt: new Date() },
        });
        processed++;
      } else {
        throw new Error(result.error ?? "Send failed");
      }

    } catch (err) {
      errors++;
      const retryCount = item.retryCount + 1;
      const maxRetries = item.maxRetries;
      const backoffMs  = Math.min(1000 * Math.pow(2, retryCount), 3_600_000);
      const nextRetry  = new Date(Date.now() + backoffMs);

      await prisma.emailQueue.update({
        where: { id: item.id },
        data: {
          status:       retryCount >= maxRetries ? "dead" : "pending",
          retryCount,
          nextRetryAt:  retryCount < maxRetries ? nextRetry : null,
          errorMessage: String(err),
        },
      });
    }
  }

  return { processed, errors };
}
