import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Delivery event webhooks from outbound providers
// Providers POST to: /api/email/webhooks/{provider}

export async function POST(
  req:     NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const admin = createAdminClient();

  try {
    const body = await req.json();

    switch (provider) {
      case "sendgrid":   await handleSendGrid(body, admin);   break;
      case "mailgun":    await handleMailgun(body, admin);    break;
      case "postmark":   await handlePostmark(body, admin);   break;
      case "ses":        await handleSES(body, admin);        break;
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
  eventType: string,
  data:      Record<string, unknown>,
  admin:     ReturnType<typeof createAdminClient>
) {
  const { data: msg } = await admin
    .from("email_messages")
    .select("id")
    .eq("provider_message_id", messageId)
    .single();

  if (!msg) return;

  await admin.from("email_delivery_events").insert({
    email_message_id: msg.id,
    event_type:       eventType,
    provider_data:    data,
  });

  // Update message status for terminal events
  const statusMap: Record<string, string> = {
    delivered: "delivered",
    bounced:   "bounced",
    rejected:  "rejected",
    complained: "rejected",
  };
  const newStatus = statusMap[eventType];
  if (newStatus) {
    await admin
      .from("email_messages")
      .update({ status: newStatus })
      .eq("id", msg.id);

    // Bounce: update customer email_status
    if (eventType === "bounced") {
      const { data: emailMsg } = await admin
        .from("email_messages")
        .select("to_address, org_id")
        .eq("id", msg.id)
        .single();
      if (emailMsg) {
        await admin
          .from("customers")
          .update({ email_status: "bounced", email_bounced_at: new Date().toISOString() })
          .eq("org_id", emailMsg.org_id)
          .eq("email", emailMsg.to_address);
      }
    }
  }
}

async function handleSendGrid(events: unknown[], admin: ReturnType<typeof createAdminClient>) {
  const eventTypeMap: Record<string, string> = {
    delivered: "delivered", open: "opened", click: "clicked",
    bounce: "bounced", blocked: "rejected", spamreport: "complained",
    deferred: "deferred",
  };
  for (const ev of (Array.isArray(events) ? events : [events])) {
    const e = ev as Record<string, unknown>;
    const eventType = eventTypeMap[e.event as string];
    if (eventType && e["smtp-id"]) {
      await recordEvent(e["smtp-id"] as string, eventType, e, admin);
    }
  }
}

async function handleMailgun(body: Record<string, unknown>, admin: ReturnType<typeof createAdminClient>) {
  const ev = body["event-data"] as Record<string, unknown> | undefined;
  if (!ev) return;
  const eventTypeMap: Record<string, string> = {
    delivered: "delivered", opened: "opened", clicked: "clicked",
    "permanent_fail": "bounced", rejected: "rejected", complained: "complained",
  };
  const msgObj  = ev["message"] as Record<string, unknown> | undefined;
  const hdrs    = msgObj?.headers as Record<string, unknown> | undefined;
  const messageId = hdrs?.["message-id"] as string | undefined;
  const eventType = eventTypeMap[ev.event as string];
  if (messageId && eventType) {
    await recordEvent(messageId, eventType, ev, admin);
  }
}

async function handlePostmark(body: Record<string, unknown>, admin: ReturnType<typeof createAdminClient>) {
  const eventTypeMap: Record<string, string> = {
    Delivery: "delivered", Open: "opened", Click: "clicked",
    Bounce: "bounced", SpamComplaint: "complained",
  };
  const recordType = body.RecordType as string;
  const messageId  = body.MessageID as string;
  const eventType  = eventTypeMap[recordType];
  if (messageId && eventType) {
    await recordEvent(messageId, eventType, body, admin);
  }
}

async function handleSES(body: Record<string, unknown>, admin: ReturnType<typeof createAdminClient>) {
  // SNS notification wrapper
  const message = typeof body.Message === "string" ? JSON.parse(body.Message) : body;
  const notif   = message.notificationType ?? message.eventType;
  const eventTypeMap: Record<string, string> = {
    Delivery: "delivered", Bounce: "bounced", Complaint: "complained",
  };
  const eventType = eventTypeMap[notif];
  const mail      = message.mail as Record<string, unknown>;
  if (mail?.messageId && eventType) {
    await recordEvent(mail.messageId as string, eventType, message, admin);
  }
}
