import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  // After code exchange, check if this is a new OAuth user (no profile yet)
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // New OAuth user — create a default org + profile
        const fullName =
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "User";

        const orgName = `${fullName}'s Workspace`;
        const slug = slugify(orgName) + "-" + Math.random().toString(36).slice(2, 7);

        const { data: org } = await admin
          .from("organizations")
          .insert({ name: orgName, slug })
          .select("id")
          .single();

        if (org) {
          await admin.from("profiles").insert({
            id: user.id,
            org_id: org.id,
            role: "owner",
            full_name: fullName,
            email: user.email ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
          });

          await admin.from("subscriptions").insert({
            org_id: org.id,
            plan: "free",
            status: "active",
          });
        }
      }
    }
  } catch {
    // Non-fatal — user may have an existing profile, or race condition
  }

  return NextResponse.redirect(`${origin}${next}`);
}
