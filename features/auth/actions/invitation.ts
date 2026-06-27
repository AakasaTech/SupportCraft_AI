"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const acceptSchema = z.object({
  token: z.string().uuid(),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function acceptInvitation(formData: FormData) {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { token, fullName, password } = parsed.data;
  const admin = createAdminClient();

  // Validate the invitation
  const { data: invitation, error: invErr } = await admin
    .from("invitations")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (invErr || !invitation) return { error: "Invalid invitation link" };
  if (invitation.accepted_at) return { error: "This invitation has already been used" };
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: "expired" };
  }

  // Create the auth user
  const supabase = await createClient();
  let userId: string;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        data: { full_name: fullName },
      },
    });

    if (authError) {
      // If user already exists, try to sign them in instead
      if (authError.message.includes("already registered")) {
        return { error: "An account with this email already exists. Please sign in and join via the invitation link." };
      }
      return { error: authError.message };
    }
    if (!authData.user) return { error: "Failed to create account" };
    userId = authData.user.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed. Please try again." };
  }

  // Create profile and mark invitation accepted
  try {
    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      org_id: invitation.org_id,
      role: invitation.role as "admin" | "agent" | "viewer",
      full_name: fullName,
      email: invitation.email,
    });

    if (profileError) return { error: `Failed to create profile: ${profileError.message}` };

    await admin
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Setup failed. Please try again." };
  }

  redirect("/dashboard");
}

export async function acceptInvitationExistingUser(formData: FormData) {
  const token = formData.get("token");
  const password = formData.get("password");

  if (!token || typeof token !== "string") return { error: "Invalid token" };
  if (!password || typeof password !== "string") return { error: "Password is required" };

  const admin = createAdminClient();

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, org_id, email, role, expires_at, accepted_at")
    .eq("token", token)
    .single();

  if (!invitation) return { error: "Invalid invitation link" };
  if (invitation.accepted_at) return { error: "This invitation has already been used" };
  if (new Date(invitation.expires_at) < new Date()) return { error: "expired" };

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: invitation.email,
      password,
    });
    if (error) return { error: error.message };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Authentication failed" };

    // Update the profile's org (switching orgs is not supported;
    // only add to org if no profile exists yet)
    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!existing) {
      await admin.from("profiles").insert({
        id: user.id,
        org_id: invitation.org_id,
        role: invitation.role as "admin" | "agent" | "viewer",
        full_name: user.user_metadata?.full_name ?? invitation.email.split("@")[0],
        email: invitation.email,
      });
    }

    await admin
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed. Please try again." };
  }

  redirect("/dashboard");
}

// Fetch invitation details for display (no auth required)
export async function getInvitationByToken(token: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("invitations")
      .select("id, email, role, expires_at, accepted_at, org_id, organizations(name, slug)")
      .eq("token", token)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
