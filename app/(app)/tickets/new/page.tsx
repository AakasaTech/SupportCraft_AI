import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { getAgents, getDepartments, getTicketTemplates } from "@/features/tickets/lib/queries";
import { NewTicketForm } from "./NewTicketForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New Ticket — SupportCraft AI" };

export default async function NewTicketPage() {
  const { profile } = await requireAuth();
  const orgId = profile.org_id;
  const supabase = await createClient();

  const [agents, departments, templates, { data: customers }] = await Promise.all([
    getAgents(orgId),
    getDepartments(orgId),
    getTicketTemplates(orgId),
    supabase.from("customers")
      .select("id, name, email, company")
      .eq("org_id", orgId)
      .order("name")
      .limit(200),
  ]);

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/tickets" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors w-fit">
            <ChevronLeft size={15} />
            Back to tickets
          </Link>
          <h1 className="text-xl font-bold">New Ticket</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create a new support ticket</p>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="max-w-2xl mx-auto sc-card p-6">
          <NewTicketForm
            customers={customers ?? []}
            agents={agents}
            departments={departments}
            templates={templates}
          />
        </div>
      </div>
    </div>
  );
}
