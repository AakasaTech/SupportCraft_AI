import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendTicketReplyEmail } from "@/lib/resend";
import { getOrgEmail } from "@/lib/email/platform-provider";
import sanitizeHtml from "sanitize-html";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id, full_name, role").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  let body: { ticketId: string; html: string; text: string; fileUrls: string[]; mode: "reply" | "note" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ticketId, html, text, fileUrls = [], mode } = body;
  if (!ticketId || (!html && !text)) {
    return NextResponse.json({ error: "Missing ticketId or content" }, { status: 400 });
  }

  const safeHtml = sanitizeHtml(html, {
    allowedTags:       sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2", "h3", "u", "s"]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ["src", "alt", "width", "height"],
      "*": ["style", "class"],
    },
  });

  const admin = createAdminClient();

  // Verify ticket belongs to this org
  const { data: ticket } = await admin
    .from("tickets")
    .select("id, title, ticket_number, org_id, customer:customers!customer_id(name, email)")
    .eq("id", ticketId)
    .eq("org_id", profile.org_id)
    .single();

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isInternal = mode === "note";
  const now        = new Date().toISOString();

  // Insert message
  const { data: msg, error: msgErr } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id:   ticketId,
      author_id:   user.id,
      content:     safeHtml,
      is_ai:       false,
      is_customer: false,
      is_internal: isInternal,
    })
    .select("id")
    .single();

  if (msgErr || !msg) {
    return NextResponse.json({ error: msgErr?.message ?? "Insert failed" }, { status: 500 });
  }

  // Update ticket timestamps + first_response_at
  const { data: existing } = await admin
    .from("tickets")
    .select("first_response_at, status")
    .eq("id", ticketId)
    .single();

  const ticketUpdate: Record<string, unknown> = { updated_at: now };
  if (!isInternal && !existing?.first_response_at) ticketUpdate.first_response_at = now;
  if (!isInternal && existing?.status === "pending") ticketUpdate.status = "open";

  await admin.from("tickets").update(ticketUpdate).eq("id", ticketId);

  // Send email for public replies
  if (!isInternal) {
    try {
      const customer = ticket.customer as { name?: string; email?: string } | null;

      const [{ data: emailSettings }, { data: lastInbound }] = await Promise.all([
        admin.from("email_settings").select("tenant_slug, display_name").eq("org_id", profile.org_id).single(),
        admin.from("email_messages").select("message_id, references")
          .eq("ticket_id", ticketId).order("created_at", { ascending: false }).limit(1).single(),
      ]);

      if (customer?.email) {
        const outboundMessageId = `reply-${ticketId}-${Date.now()}@supportcraft.aakasa.dev`;
        const prevRefs: string[] = Array.isArray(lastInbound?.references) ? lastInbound.references : [];
        const inReplyToId = lastInbound?.message_id ?? undefined;
        const references  = inReplyToId ? [...prevRefs, inReplyToId] : prevRefs;

        const fromAddress = emailSettings?.tenant_slug ? getOrgEmail(emailSettings.tenant_slug) : undefined;
        const displayName = emailSettings?.display_name ?? emailSettings?.tenant_slug ?? undefined;

        await sendTicketReplyEmail({
          to:                customer.email,
          customerName:      customer.name ?? "Customer",
          agentName:         profile.full_name ?? "Support Team",
          ticketTitle:       ticket.title ?? "",
          replyContent:      text,
          ticketId,
          ticketNumber:      ticket.ticket_number ?? undefined,
          fromAddress,
          displayName,
          outboundMessageId,
          inReplyTo:         inReplyToId,
          references:        references.length ? references : undefined,
        });

        await admin.from("email_messages").insert({
          org_id:      profile.org_id,
          ticket_id:   ticketId,
          direction:   "outbound",
          message_id:  outboundMessageId,
          in_reply_to: inReplyToId ?? null,
          references,
          from_address: fromAddress ?? "noreply@supportcraft.aakasa.dev",
          to_address:  customer.email,
          subject:     ticket.ticket_number
            ? `[Ticket #${ticket.ticket_number}] ${ticket.title}`
            : ticket.title,
          body_plain:  text,
          body_html:   safeHtml,
          status:      "sent",
        });
      }
    } catch (e) {
      console.error("Reply email failed:", e);
      // Non-fatal — message is already saved
    }
  }

  return NextResponse.json({ messageId: msg.id });
}
