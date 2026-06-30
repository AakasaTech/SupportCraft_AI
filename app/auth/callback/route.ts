import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Use NEXT_PUBLIC_APP_URL (baked at build time) so redirects go to the
  // public hostname rather than the internal Docker bind address (0.0.0.0).
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
  }

  // Build the redirect response first so we can write session cookies onto it.
  const redirectUrl = new URL(`${appUrl}${next}`);
  const response = NextResponse.redirect(redirectUrl);

  // Create a Supabase client whose cookie setter writes directly to the
  // redirect response — this is the only way cookies survive a redirect in
  // a Next.js Route Handler.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${appUrl}/login?error=auth_callback_failed`);
  }

  // Auto-provision org + profile for new OAuth users
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
            id:         user.id,
            org_id:     org.id,
            role:       "owner",
            full_name:  fullName,
            email:      user.email ?? "",
            avatar_url: user.user_metadata?.avatar_url ?? null,
          });

          await admin.from("subscriptions").insert({
            org_id: org.id,
            plan:   "free",
            status: "active",
          });
        }
      }
    }
  } catch {
    // Non-fatal — existing user or race condition
  }

  return response;
}
