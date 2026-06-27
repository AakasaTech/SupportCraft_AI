import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { PortalProfileForm } from "./PortalProfileForm";
import { User } from "lucide-react";

export const metadata: Metadata = { title: "Profile" };

export default async function PortalProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) redirect("/portal/dashboard");

  const primary = customers[0];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Your Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your contact information.</p>
      </div>

      {/* Avatar + org info */}
      <div className="sc-card p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shrink-0">
          {primary.name?.[0]?.toUpperCase() ?? <User size={24} />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{primary.name}</p>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          {customers.length === 1 && (
            <p className="text-xs text-muted-foreground mt-0.5">{primary.org_name}</p>
          )}
          {customers.length > 1 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {customers.length} organizations
            </p>
          )}
        </div>
      </div>

      {/* Edit form */}
      <div className="sc-card p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Contact Information</h2>
        <PortalProfileForm customer={primary} email={user.email ?? ""} />
      </div>
    </div>
  );
}
