import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shared/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrgSettingsForm } from "@/features/settings/components/OrgSettingsForm";
import { ProfileSettingsForm } from "@/features/settings/components/ProfileSettingsForm";
import type { Organization, Profile } from "@/types/database";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", user.id)
    .single();

  if (!profileRow) redirect("/login");

  const profile = profileRow as Profile & { organizations: Organization };

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
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
