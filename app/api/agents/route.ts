import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data: profile } = await supabase
    .from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile) return NextResponse.json([]);

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("org_id", profile.org_id)
    .in("role", ["owner", "admin", "agent"])
    .neq("id", user.id)
    .order("full_name");

  const agents = (data ?? []).map(p => ({
    id:         p.id,
    name:       p.full_name ?? "Agent",
    role:       p.role,
    avatarUrl:  p.avatar_url,
  }));

  return NextResponse.json(agents);
}
