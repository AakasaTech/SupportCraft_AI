import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma/client";
import { getOrgEmail } from "@/lib/email/platform-provider";
import { z } from "zod";

export const runtime = "nodejs";

// Only customer-facing fields — provider/SMTP config is platform-managed
const settingsSchema = z.object({
  tenant_slug:        z.string().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only").min(2).max(30),
  display_name:       z.string().max(100).optional(),
  reply_to:           z.string().email().optional().or(z.literal("")),
  signature_html:     z.string().max(5000).optional(),
  footer_html:        z.string().max(2000).optional(),
  auto_reply_enabled: z.boolean().optional(),
  auto_reply_config:  z.record(z.unknown()).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await prisma.emailSettings.findUnique({
    where:  { organizationId: user.profile.organizationId },
    select: { tenantSlug: true, displayName: true, replyTo: true, signatureHtml: true, footerHtml: true, autoReplyEnabled: true, autoReplyConfig: true },
  });

  const settings = row && {
    tenant_slug:        row.tenantSlug,
    display_name:       row.displayName,
    reply_to:           row.replyTo,
    signature_html:     row.signatureHtml,
    footer_html:        row.footerHtml,
    auto_reply_enabled: row.autoReplyEnabled,
    auto_reply_config:  row.autoReplyConfig,
  };

  return NextResponse.json({
    settings: settings ?? null,
    support_email: settings?.tenant_slug ? getOrgEmail(settings.tenant_slug) : null,
  });
}

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["owner", "admin"].includes(user.profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check slug uniqueness (exclude current org)
  const slug = parsed.data.tenant_slug;
  const conflict = await prisma.emailSettings.findFirst({
    where:  { tenantSlug: slug, organizationId: { not: user.profile.organizationId } },
    select: { organizationId: true },
  });

  if (conflict) {
    return NextResponse.json(
      { error: { fieldErrors: { tenant_slug: [`"${slug}" is already taken`] } } },
      { status: 409 }
    );
  }

  // Derive the canonical support_email from slug — always identical
  const supportEmail = getOrgEmail(slug);

  const data = await prisma.emailSettings.upsert({
    where: { organizationId: user.profile.organizationId },
    create: {
      organizationId: user.profile.organizationId,
      supportEmail,
      tenantSlug:       parsed.data.tenant_slug,
      displayName:      parsed.data.display_name,
      replyTo:          parsed.data.reply_to || undefined,
      signatureHtml:    parsed.data.signature_html,
      footerHtml:        parsed.data.footer_html,
      autoReplyEnabled: parsed.data.auto_reply_enabled,
      autoReplyConfig:  parsed.data.auto_reply_config as Prisma.InputJsonValue | undefined,
    },
    update: {
      supportEmail,
      tenantSlug:       parsed.data.tenant_slug,
      displayName:      parsed.data.display_name,
      replyTo:          parsed.data.reply_to || undefined,
      signatureHtml:    parsed.data.signature_html,
      footerHtml:        parsed.data.footer_html,
      autoReplyEnabled: parsed.data.auto_reply_enabled,
      autoReplyConfig:  parsed.data.auto_reply_config as Prisma.InputJsonValue | undefined,
    },
    select: { tenantSlug: true, displayName: true, replyTo: true, signatureHtml: true, autoReplyEnabled: true },
  });

  // Keep organizations.support_email in sync so email templates always use the right address
  await prisma.organization.update({
    where: { id: user.profile.organizationId },
    data:  { supportEmail },
  });

  return NextResponse.json({
    settings: {
      tenant_slug:        data.tenantSlug,
      display_name:       data.displayName,
      reply_to:           data.replyTo,
      signature_html:     data.signatureHtml,
      auto_reply_enabled: data.autoReplyEnabled,
    },
    support_email: supportEmail,
  });
}
