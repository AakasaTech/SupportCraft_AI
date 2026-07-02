"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export interface CannedResponse {
  id?:       string;
  name:      string;
  shortcut:  string; // e.g. "greeting" → slug "canned-greeting"
  bodyHtml:  string;
}

async function getOrgAndRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles").select("org_id, role").eq("id", user.id).single();
  return { user, profile, admin };
}

export async function getCannedResponses(): Promise<CannedResponse[]> {
  const { profile, admin } = await getOrgAndRole();
  if (!profile) return [];

  const { data } = await admin
    .from("email_templates")
    .select("id, name, slug, body_html")
    .eq("org_id", profile.org_id)
    .eq("is_system", false)
    .like("slug", "canned-%")
    .order("name");

  return (data ?? []).map(r => ({
    id:       r.id,
    name:     r.name,
    shortcut: r.slug.replace(/^canned-/, ""),
    bodyHtml: r.body_html ?? "",
  }));
}

export async function saveCannedResponse(
  item: CannedResponse
): Promise<{ error?: string; id?: string }> {
  const { profile, admin } = await getOrgAndRole();
  if (!profile) return { error: "Not authenticated" };
  if (!["owner", "admin", "agent"].includes(profile.role)) return { error: "Unauthorized" };

  const slug = `canned-${item.shortcut.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;

  if (item.id) {
    // Update existing
    const { error } = await admin
      .from("email_templates")
      .update({ name: item.name, subject: item.name, slug, body_html: item.bodyHtml, body_plain: "" })
      .eq("id", item.id)
      .eq("org_id", profile.org_id);
    if (error) return { error: error.message };
    return { id: item.id };
  }

  // Create new
  const { data, error } = await admin
    .from("email_templates")
    .insert({
      org_id:     profile.org_id,
      slug,
      name:       item.name,
      subject:    item.name,
      body_html:  item.bodyHtml,
      body_plain: "",
      is_system:  false,
      is_active:  true,
      variables:  [],
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data?.id };
}

export async function deleteCannedResponse(id: string): Promise<{ error?: string }> {
  const { profile, admin } = await getOrgAndRole();
  if (!profile) return { error: "Not authenticated" };
  if (!["owner", "admin", "agent"].includes(profile.role)) return { error: "Unauthorized" };

  const { error } = await admin
    .from("email_templates")
    .delete()
    .eq("id", id)
    .eq("org_id", profile.org_id)
    .like("slug", "canned-%");

  if (error) return { error: error.message };
  return {};
}
