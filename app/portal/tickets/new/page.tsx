import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { resolvePortalCustomers } from "@/lib/portal/customer";
import { PortalCreateTicketForm } from "./PortalCreateTicketForm";

export const metadata: Metadata = { title: "New Ticket" };

export default async function PortalNewTicketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const customers = await resolvePortalCustomers(user.id, user.email ?? "");
  if (customers.length === 0) redirect("/portal/tickets");

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/portal/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>
        <h1 className="text-xl font-bold text-foreground">Submit a Support Ticket</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Describe your issue and our team will get back to you as soon as possible.
        </p>
      </div>

      <div className="sc-card p-6">
        <PortalCreateTicketForm customers={customers} />
      </div>
    </div>
  );
}
