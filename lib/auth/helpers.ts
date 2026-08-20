import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { Profile, Organization, UserRole } from "@/lib/generated/prisma/client";

export interface CurrentUser {
  id: string;
  email: string;
  profile: Profile;
  organization: Organization;
}

/**
 * Returns the current authenticated user with profile + org, or null.
 * Safe to call from Server Components and Server Actions.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return null;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: { organization: true },
    });
    if (!profile) return null;

    return {
      id: userId,
      email: session.user.email ?? "",
      profile,
      organization: profile.organization,
    };
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 * Returns the current user (guaranteed non-null after this call).
 *
 * Portal customers have a session but no agent profile row. Redirecting
 * them to /login causes an infinite loop (middleware bounces authenticated
 * users back to /dashboard, which calls requireAuth again). We detect this
 * case and send them to the portal instead.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { organization: true },
  });

  if (!profile) {
    // Authenticated but no agent profile = portal customer navigating to an agent page
    redirect("/portal/tickets");
  }

  return {
    id: userId,
    email: session.user.email ?? "",
    profile,
    organization: profile.organization,
  };
}

/**
 * Requires the user to have at least the given role.
 * Redirects to /unauthorized if the role is insufficient.
 */
export async function requireRole(minimumRole: UserRole): Promise<CurrentUser> {
  const user = await requireAuth();
  const roleRank: Record<UserRole, number> = { owner: 4, admin: 3, agent: 2, viewer: 1 };
  if (roleRank[user.profile.role] < roleRank[minimumRole]) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Requires a specific permission. Redirects to /unauthorized if not permitted.
 */
export async function requirePermission(permission: Permission): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!hasPermission(user.profile.role, permission)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Returns just the authenticated user's session (lightweight — no profile query).
 * Useful for routes that only need to verify auth without loading profile data.
 */
export async function getAuthUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { id: session.user.id, email: session.user.email ?? null };
  } catch {
    return null;
  }
}
