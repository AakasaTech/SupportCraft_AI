import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/is-admin-email";

export { isAdminEmail };

/** Throws a redirect-safe error if the caller is not an admin. */
export async function verifyAdmin(): Promise<{ email: string; userId: string }> {
  const session = await auth();
  const email = session?.user?.email;
  const userId = session?.user?.id;

  if (!email || !userId || !isAdminEmail(email)) {
    throw new Error("Unauthorized");
  }

  return { email, userId };
}
