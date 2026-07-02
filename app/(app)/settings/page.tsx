import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquareText, ChevronRight } from "lucide-react";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { Header } from "@/components/shared/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettingsForm } from "@/features/settings/components/OrgSettingsForm";
import { ProfileSettingsForm } from "@/features/settings/components/ProfileSettingsForm";
import { getOrgEmail } from "@/lib/email/platform-provider";
import type { Organization, Profile } from "@/types/database";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  if (!profileRow) redirect("/login");

  const profile = profileRow as Profile & { organizations: Organization };

  // Derive the canonical support email from email_settings so it stays in sync
  const { data: emailSettings } = await admin
    .from("email_settings")
    .select("tenant_slug")
    .eq("org_id", profile.org_id)
    .single();

  const derivedSupportEmail = emailSettings?.tenant_slug
    ? getOrgEmail(emailSettings.tenant_slug)
    : null;

  return (
    <div>
      <Header title="Settings" description="Manage your account and organization" />
      <div className="p-6 max-w-2xl">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileSettingsForm profile={profile} />
          </TabsContent>
          <TabsContent value="organization">
            <OrgSettingsForm
              org={profile.organizations}
              isAdmin={["owner", "admin"].includes(profile.role)}
              derivedSupportEmail={derivedSupportEmail}
            />
          </TabsContent>
        </Tabs>

        {/* Quick links to sub-settings */}
        <div className="mt-8 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">More settings</p>
          {[
            { href: "/settings/email",            icon: Mail,                label: "Email",            desc: "Configure your support address and templates" },
            { href: "/settings/canned-responses", icon: MessageSquareText,   label: "Canned Responses", desc: "Pre-written replies for common questions" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <Icon size={16} className="text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
