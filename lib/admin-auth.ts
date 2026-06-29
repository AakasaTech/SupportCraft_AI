import { createClient } from "@/lib/supabase/server";

export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

/** Throws a redirect-safe error if the caller is not an admin. */
export async function verifyAdmin(): Promise<{ email: string; userId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized");
  }

  return { email: user.email, userId: user.id };
}
