"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

const ACK_SLUG = "ticket-acknowledgement";

export interface AckTemplate {
  subject:   string;
  bodyPlain: string;
  isActive:  boolean;
}

export async function getAckTemplate(): Promise<AckTemplate | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const template = await prisma.emailTemplate.findFirst({
    where:  { organizationId: user.profile.organizationId, slug: ACK_SLUG },
    select: { subject: true, bodyPlain: true, isActive: true },
  });

  if (!template) return null;
  return { subject: template.subject, bodyPlain: template.bodyPlain ?? "", isActive: template.isActive };
}

export async function saveAckTemplate(template: AckTemplate): Promise<{ error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Not authenticated" };
  if (!["owner", "admin"].includes(user.profile.role)) return { error: "Unauthorized" };

  const bodyHtml = template.bodyPlain
    .split("\n\n")
    .map(p => `<p style="margin:0 0 12px;color:#555;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  await prisma.emailTemplate.upsert({
    where: { organizationId_slug: { organizationId: user.profile.organizationId, slug: ACK_SLUG } },
    create: {
      organizationId: user.profile.organizationId,
      slug:       ACK_SLUG,
      name:       "Ticket Acknowledgement",
      subject:    template.subject,
      bodyHtml,
      bodyPlain:  template.bodyPlain,
      isSystem:   false,
      isActive:   template.isActive,
      variables:  ["customer_name", "ticket_number", "ticket_subject", "organization_name", "support_email"],
    },
    update: {
      subject:   template.subject,
      bodyHtml,
      bodyPlain: template.bodyPlain,
      isActive:  template.isActive,
    },
  });

  return {};
}
