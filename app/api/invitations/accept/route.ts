import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/login?error=invalid_invitation", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  const supabase = await createClient();

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    return NextResponse.redirect(
      new URL("/login?error=invitation_expired", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  return NextResponse.redirect(
    new URL(
      `/register?invitation=${token}&email=${encodeURIComponent(invitation.email)}`,
      process.env.NEXT_PUBLIC_APP_URL!
    )
  );
}

export async function POST(request: Request) {
  const { token, userId } = await request.json();

  if (!token || !userId) {
    return NextResponse.json({ error: "Missing token or userId" }, { status: 400 });
  }

  const adminSupabase = createAdminClient();

  const { data: invitation } = await adminSupabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
  }

  const { error: profileError } = await adminSupabase.from("profiles").insert({
    id: userId,
    org_id: invitation.org_id,
    role: invitation.role,
    full_name: "",
    email: invitation.email,
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  await adminSupabase
    .from("invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({ success: true, orgId: invitation.org_id });
}
