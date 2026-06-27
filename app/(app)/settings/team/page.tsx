import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shared/Header";
import { TeamMemberList } from "@/features/settings/components/TeamMemberList";
import { InviteForm } from "@/features/settings/components/InviteForm";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const [{ data: members }, { data: invitations }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role, avatar_url, created_at")
      .eq("org_id", profile.org_id)
      .order("created_at"),
    supabase
      .from("invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("org_id", profile.org_id)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
  ]);

  const isAdmin = ["owner", "admin"].includes(profile.role);

  return (
    <div>
      <Header title="Team" description="Manage agents and invitations" />
      <div className="p-6 space-y-8 max-w-3xl">
        {isAdmin && <InviteForm />}
        <TeamMemberList
          members={members ?? []}
          invitations={invitations ?? []}
          currentUserId={user.id}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  );
}
