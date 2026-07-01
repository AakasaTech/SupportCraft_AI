import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code  = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3002").replace(/\/$/, "");

  // Read one-time cookies set by /api/auth/google
  const storedState  = request.cookies.get("g_oauth_state")?.value;
  const codeVerifier = request.cookies.get("g_oauth_verifier")?.value;
  const rawNonce     = request.cookies.get("g_oauth_nonce")?.value;
  const next         = request.cookies.get("g_oauth_next")?.value ?? "/dashboard";

  const clearCookies = (res: NextResponse) => {
    for (const name of ["g_oauth_state", "g_oauth_verifier", "g_oauth_nonce", "g_oauth_next"]) {
      res.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
    return res;
  };

  const loginError = (msg: string) => {
    const url = new URL("/login", base);
    url.searchParams.set("error", msg);
    return clearCookies(NextResponse.redirect(url));
  };

  if (error)                                               return loginError("Google sign-in was cancelled.");
  if (!code || !state || !storedState || !codeVerifier || !rawNonce)
                                                           return loginError("Missing authentication parameters. Please try again.");
  if (state !== storedState)                               return loginError("Invalid authentication state. Please try again.");

  // Exchange authorisation code → tokens via Google
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  `${base}/auth/google/callback`,
      grant_type:    "authorization_code",
      code_verifier: codeVerifier,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[google/callback] token exchange failed:", await tokenRes.text());
    return loginError("Failed to complete Google sign-in. Please try again.");
  }

  const { id_token } = await tokenRes.json() as { id_token?: string };
  if (!id_token) return loginError("No identity token returned by Google.");

  // Build redirect response FIRST so session cookies are written directly onto it.
  // (Cookies written via next/headers don't survive a NextResponse.redirect().)
  const redirectResponse = NextResponse.redirect(new URL(`${base}${next}`));

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
            redirectResponse.cookies.set(name, value, options as Parameters<typeof redirectResponse.cookies.set>[2]);
          });
        },
      },
    }
  );

  const { error: sbError } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token:    id_token,
    nonce:    rawNonce,
  });

  if (sbError) {
    console.error("[google/callback] supabase signInWithIdToken:", sbError.message);
    return loginError("Could not complete sign-in. Please try again.");
  }

  // Auto-provision org + profile for new Google Sign-In users
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
        const slug    = slugify(orgName) + "-" + Math.random().toString(36).slice(2, 7);

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

  return clearCookies(redirectResponse);
}
