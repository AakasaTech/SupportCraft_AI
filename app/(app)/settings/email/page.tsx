import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { EmailSettingsForm } from "@/components/email/settings/EmailSettingsForm";
import { getOrgEmail } from "@/lib/email/platform-provider";

export const metadata: Metadata = { title: "Email Settings | SupportCraft" };

export default async function EmailSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id, role").eq("id", user.id).single();
  if (!profile) redirect("/login");
  if (!["owner", "admin"].includes(profile.role)) redirect("/settings");

  const { data: settings } = await admin
    .from("email_settings")
    .select("tenant_slug, display_name, reply_to, signature_html, auto_reply_enabled")
    .eq("org_id", profile.org_id)
    .single();

  const supportEmail = settings?.tenant_slug ? getOrgEmail(settings.tenant_slug) : null;

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
