import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/shared/Header";
import { CustomerTable } from "@/features/customers/components/CustomerTable";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Header
        title="Customers"
        description="Your customer directory"
        actions={
          <Button asChild>
            <Link href="/customers/new">
              <Plus />
              Add Customer
            </Link>
          </Button>
        }
      />
      <div className="p-6">
        <CustomerTable customers={customers ?? []} />
      </div>
    </div>
  );
}
