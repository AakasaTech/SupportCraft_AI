import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { sendTicketReplyEmail } from "@/lib/resend";
import { getOrgEmail } from "@/lib/email/platform-provider";
import sanitizeHtml from "sanitize-html";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { ticketId: string; html: string; text: string; fileUrls: string[]; mode: "reply" | "note" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ticketId, html, text, mode } = body;
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

  // Verify ticket belongs to this org
  const ticket = await prisma.ticket.findFirst({
    where:  { id: ticketId, organizationId: user.profile.organizationId },
    select: {
      id: true, title: true, ticketNumber: true, firstResponseAt: true, status: true,
      customer: { select: { name: true, email: true } },
    },
  });

  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

  const isInternal = mode === "note";

  // Insert message
  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId,
      authorId:   user.profile.id,
      content:    safeHtml,
      isAi:       false,
      isCustomer: false,
      isInternal,
    },
    select: { id: true },
  });

  // Update ticket timestamps + first_response_at
  await prisma.ticket.update({
    where: { id: ticketId },
    data: {
      ...(!isInternal && !ticket.firstResponseAt ? { firstResponseAt: new Date() } : {}),
      ...(!isInternal && ticket.status === "pending" ? { status: "open" } : {}),
    },
  });

  // Send email for public replies
  if (!isInternal) {
    try {
      const customer = ticket.customer;

      const [emailSettings, lastInbound] = await Promise.all([
        prisma.emailSettings.findUnique({
          where:  { organizationId: user.profile.organizationId },
          select: { tenantSlug: true, displayName: true },
        }),
        prisma.emailMessage.findFirst({
          where:   { ticketId },
          select:  { messageId: true, messageReferences: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      if (customer?.email) {
        const outboundMessageId = `reply-${ticketId}-${Date.now()}@supportcraft.aakasa.dev`;
        const prevRefs: string[] = lastInbound?.messageReferences ?? [];
        const inReplyToId = lastInbound?.messageId ?? undefined;
        const references  = inReplyToId ? [...prevRefs, inReplyToId] : prevRefs;

        const fromAddress = emailSettings?.tenantSlug ? getOrgEmail(emailSettings.tenantSlug) : undefined;
        const displayName = emailSettings?.displayName ?? emailSettings?.tenantSlug ?? undefined;

        await sendTicketReplyEmail({
          to:                customer.email,
          customerName:      customer.name ?? "Customer",
          agentName:         user.profile.fullName ?? "Support Team",
          ticketTitle:       ticket.title ?? "",
          replyContent:      text,
          ticketId,
          ticketNumber:      ticket.ticketNumber ?? undefined,
          fromAddress,
          displayName,
          outboundMessageId,
          inReplyTo:         inReplyToId,
          references:        references.length ? references : undefined,
        });

        await prisma.emailMessage.create({
          data: {
            organizationId: user.profile.organizationId,
            ticketId,
            direction:   "outbound",
            messageId:   outboundMessageId,
            inReplyTo:   inReplyToId ?? null,
            messageReferences: references,
            fromAddress: fromAddress ?? "noreply@supportcraft.aakasa.dev",
            toAddress:   customer.email,
            subject:     ticket.ticketNumber
              ? `[Ticket #${ticket.ticketNumber}] ${ticket.title}`
              : ticket.title,
            bodyPlain:   text,
            bodyHtml:    safeHtml,
            status:      "sent",
          },
        });
      }
    } catch (e) {
      console.error("Reply email failed:", e);
      // Non-fatal — message is already saved
    }
  }

  return NextResponse.json({ messageId: msg.id });
}
