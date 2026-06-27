import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { Profile, Organization, UserRole } from "@/types/database";

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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*, organizations(*)")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    const org = (profile as unknown as { organizations: Organization }).organizations;
    if (!org) return null;

    return {
      id: user.id,
      email: user.email ?? "",
      profile: profile as Profile,
      organization: org,
    };
  } catch {
    return null;
  }
}

/**
 * Requires authentication. Redirects to /login if not authenticated.
 * Returns the current user (guaranteed non-null after this call).
 *
 * Portal customers have a Supabase auth session but no agent profile row.
 * Redirecting them to /login causes an infinite loop (middleware bounces
 * authenticated users back to /dashboard, which calls requireAuth again).
 * We detect this case and send them to the portal instead.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    // Authenticated but no agent profile = portal customer navigating to an agent page
    redirect("/portal/tickets");
  }

  const org = (profile as unknown as { organizations: Organization }).organizations;
  if (!org) redirect("/login");

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    profile: profile as Profile,
    organization: org,
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
 * Returns just the authenticated Supabase user (lightweight — no profile query).
 * Useful for routes that only need to verify auth without loading profile data.
 */
export async function getAuthUser() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
