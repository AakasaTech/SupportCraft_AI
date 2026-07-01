"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const ACK_SLUG = "ticket-acknowledgement";

export interface AckTemplate {
  subject:   string;
  bodyPlain: string;
  isActive:  boolean;
}

export async function getAckTemplate(): Promise<AckTemplate | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return null;

  const { data } = await admin
    .from("email_templates")
    .select("subject, body_plain, is_active")
    .eq("org_id", profile.org_id)
    .eq("slug", ACK_SLUG)
    .single();

  if (!data) return null;
  return { subject: data.subject, bodyPlain: data.body_plain ?? "", isActive: data.is_active };
}

export async function saveAckTemplate(template: AckTemplate): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id, role").eq("id", user.id).single();
  if (!profile) return { error: "Profile not found" };
  if (!["owner", "admin"].includes(profile.role)) return { error: "Unauthorized" };

  const bodyHtml = template.bodyPlain
    .split("\n\n")
    .map(p => `<p style="margin:0 0 12px;color:#555;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("\n");

  const { error } = await admin
    .from("email_templates")
    .upsert(
      {
        org_id:     profile.org_id,
        slug:       ACK_SLUG,
        name:       "Ticket Acknowledgement",
        subject:    template.subject,
        body_html:  bodyHtml,
        body_plain: template.bodyPlain,
        is_system:  false,
        is_active:  template.isActive,
        variables:  ["customer_name", "ticket_number", "ticket_subject", "organization_name", "support_email"],
      },
      { onConflict: "org_id,slug" }
    );

  if (error) return { error: error.message };
  return {};
}
