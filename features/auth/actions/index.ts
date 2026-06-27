"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "../schemas";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Sign in failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    orgName: formData.get("orgName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { fullName, orgName, email, password } = parsed.data;

  let userId: string;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (authError) return { error: authError.message };
    if (!authData.user) return { error: "Failed to create account" };

    userId = authData.user.id;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed. Please try again." };
  }

  // Use admin client for org/profile — user has no profile yet so
  // get_user_org_id() returns null and RLS blocks the anon-key client.
  try {
    const admin = createAdminClient();
    const slug = slugify(orgName) + "-" + Math.random().toString(36).slice(2, 7);

    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: orgName, slug })
      .select("id")
      .single();

    if (orgError) return { error: `Failed to create organization: ${orgError.message}` };

    const { error: profileError } = await admin.from("profiles").insert({
      id: userId,
      org_id: org.id,
      role: "owner",
      full_name: fullName,
      email,
    });

    if (profileError) return { error: `Failed to create profile: ${profileError.message}` };

    await admin.from("subscriptions").insert({
      org_id: org.id,
      plan: "free",
      status: "active",
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Setup failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`,
    });

    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed. Please try again." };
  }

  return { success: "Check your email for the password reset link" };
}

export async function signInWithOAuth(provider: "google" | "azure") {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        scopes: provider === "azure" ? "openid profile email" : undefined,
      },
    });

    if (error) return { error: error.message };
    if (data.url) return { url: data.url };
    return { error: "OAuth setup failed" };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "OAuth failed. Please try again." };
  }
}

export async function signInWithMagicLink(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email");
  if (!email || typeof email !== "string") return { error: "Email is required" };

  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/portal/dashboard`,
      },
    });

    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Request failed. Please try again." };
  }

  return { success: "Check your email for the magic link" };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Update failed. Please try again." };
  }

  redirect("/dashboard");
}
