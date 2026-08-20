import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { EmailSettingsForm } from "@/components/email/settings/EmailSettingsForm";
import { getOrgEmail } from "@/lib/email/platform-provider";
import { AckTemplateForm } from "@/features/settings/components/AckTemplateForm";
import { getAckTemplate } from "@/features/settings/actions/emailTemplates";

export const metadata: Metadata = { title: "Email Settings | SupportCraft" };

export default async function EmailSettingsPage() {
  const user = await requireAuth();
  if (!["owner", "admin"].includes(user.profile.role)) redirect("/settings");

  const row = await prisma.emailSettings.findUnique({
    where:  { organizationId: user.profile.organizationId },
    select: { tenantSlug: true, displayName: true, replyTo: true, signatureHtml: true, autoReplyEnabled: true },
  });
  const settings = row && {
    tenant_slug: row.tenantSlug ?? undefined,
    display_name: row.displayName ?? undefined,
    reply_to: row.replyTo ?? undefined,
    signature_html: row.signatureHtml ?? undefined,
    auto_reply_enabled: row.autoReplyEnabled,
  };

  const supportEmail  = settings?.tenant_slug ? getOrgEmail(settings.tenant_slug) : null;
  const ackTemplate   = await getAckTemplate();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Settings
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold text-foreground">Email</h1>
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        Set up your support email address. Customers email you here — replies go from the same address.
      </p>

      <EmailSettingsForm
        initialSettings={settings ?? null}
        initialEmail={supportEmail}
      />

      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Email Templates</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Customise the emails SupportCraft sends automatically when tickets are created or updated.
        </p>
        <AckTemplateForm initial={ackTemplate} />
      </div>

      {/* Info box */}
      <div className="sc-card p-5 flex gap-3">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">How it works</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Your support address is <strong>slug@supportcraft.aakasa.dev</strong></li>
            <li>• Inbound emails automatically open tickets in SupportCraft</li>
            <li>• Outbound replies are sent from the same address via SupportCraft&apos;s infrastructure</li>
            <li>• No SMTP setup needed — everything is managed for you</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
