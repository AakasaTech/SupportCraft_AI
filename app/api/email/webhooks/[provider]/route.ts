import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { EmailDeliveryEventType, Prisma } from "@/lib/generated/prisma/client";

export const runtime = "nodejs";

// Delivery event webhooks from outbound providers
// Providers POST to: /api/email/webhooks/{provider}

export async function POST(
  req:     NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  try {
    const body = await req.json();

    switch (provider) {
      case "sendgrid":   await handleSendGrid(body);   break;
      case "mailgun":    await handleMailgun(body);    break;
      case "postmark":   await handlePostmark(body);   break;
      case "ses":        await handleSES(body);        break;
      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(`Webhook error [${provider}]:`, err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function recordEvent(
  messageId: string,
  eventType: EmailDeliveryEventType,
  data:      Record<string, unknown>,
) {
  const msg = await prisma.emailMessage.findFirst({
    where:  { providerMessageId: messageId },
    select: { id: true },
  });

  if (!msg) return;

  await prisma.emailDeliveryEvent.create({
    data: { emailMessageId: msg.id, eventType, providerData: data as Prisma.InputJsonValue },
  });

  // Update message status for terminal events
  const statusMap: Partial<Record<EmailDeliveryEventType, "delivered" | "bounced" | "rejected">> = {
    delivered: "delivered",
    bounced:   "bounced",
    rejected:  "rejected",
    complained: "rejected",
  };
  const newStatus = statusMap[eventType];
  if (newStatus) {
    await prisma.emailMessage.update({
      where: { id: msg.id },
      data:  { status: newStatus },
    });

    // Bounce: update customer email_status
    if (eventType === "bounced") {
      const emailMsg = await prisma.emailMessage.findUnique({
        where:  { id: msg.id },
        select: { toAddress: true, organizationId: true },
      });
      if (emailMsg) {
        await prisma.customer.updateMany({
          where: { organizationId: emailMsg.organizationId, email: emailMsg.toAddress },
          data:  { emailStatus: "bounced", emailBouncedAt: new Date() },
        });
      }
    }
  }
}

async function handleSendGrid(events: unknown[]) {
  const eventTypeMap: Record<string, EmailDeliveryEventType> = {
    delivered: "delivered", open: "opened", click: "clicked",
    bounce: "bounced", blocked: "rejected", spamreport: "complained",
    deferred: "deferred",
  };
  for (const ev of (Array.isArray(events) ? events : [events])) {
    const e = ev as Record<string, unknown>;
    const eventType = eventTypeMap[e.event as string];
    if (eventType && e["smtp-id"]) {
      await recordEvent(e["smtp-id"] as string, eventType, e);
    }
  }
}

async function handleMailgun(body: Record<string, unknown>) {
  const ev = body["event-data"] as Record<string, unknown> | undefined;
  if (!ev) return;
  const eventTypeMap: Record<string, EmailDeliveryEventType> = {
    delivered: "delivered", opened: "opened", clicked: "clicked",
    "permanent_fail": "bounced", rejected: "rejected", complained: "complained",
  };
  const msgObj  = ev["message"] as Record<string, unknown> | undefined;
  const hdrs    = msgObj?.headers as Record<string, unknown> | undefined;
  const messageId = hdrs?.["message-id"] as string | undefined;
  const eventType = eventTypeMap[ev.event as string];
  if (messageId && eventType) {
    await recordEvent(messageId, eventType, ev);
  }
}

async function handlePostmark(body: Record<string, unknown>) {
  const eventTypeMap: Record<string, EmailDeliveryEventType> = {
    Delivery: "delivered", Open: "opened", Click: "clicked",
    Bounce: "bounced", SpamComplaint: "complained",
  };
  const recordType = body.RecordType as string;
  const messageId  = body.MessageID as string;
  const eventType  = eventTypeMap[recordType];
  if (messageId && eventType) {
    await recordEvent(messageId, eventType, body);
  }
}

async function handleSES(body: Record<string, unknown>) {
  // SNS notification wrapper
  const message = typeof body.Message === "string" ? JSON.parse(body.Message) : body;
  const notif   = message.notificationType ?? message.eventType;
  const eventTypeMap: Record<string, EmailDeliveryEventType> = {
    Delivery: "delivered", Bounce: "bounced", Complaint: "complained",
  };
  const eventType = eventTypeMap[notif];
  const mail      = message.mail as Record<string, unknown>;
  if (mail?.messageId && eventType) {
    await recordEvent(mail.messageId as string, eventType, message);
  }
}
