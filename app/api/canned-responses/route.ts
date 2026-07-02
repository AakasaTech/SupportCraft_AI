import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json([]);

  // Org-specific non-system templates serve as canned responses
  const { data } = await supabase
    .from("email_templates")
    .select("id, name, body_html, slug")
    .eq("org_id", profile.org_id)
    .eq("is_system", false)
    .eq("is_active", true)
    .neq("slug", "ticket-acknowledgement")
    .order("name");

  const responses = (data ?? []).map(t => ({
    id:       t.id,
    title:    t.name,
    body:     t.body_html,
    shortcut: t.slug?.startsWith("canned-") ? `/${t.slug.replace("canned-", "")}` : undefined,
  }));

  return NextResponse.json(responses);
}
