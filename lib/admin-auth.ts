import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/is-admin-email";

export { isAdminEmail };

/** Throws a redirect-safe error if the caller is not an admin. */
export async function verifyAdmin(): Promise<{ email: string; userId: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    throw new Error("Unauthorized");
  }

  return { email: user.email, userId: user.id };
}
