import { createAdminClient } from "@/lib/supabase/server";

export interface PortalCustomer {
  id:       string;
  name:     string;
  email:    string;
  org_id:   string;
  org_name: string;
}

/**
 * Resolve all customer records for a portal user across all organisations.
 *
 * Agents create customers with auth_user_id = NULL. On first portal login
 * we fall back to email matching (case-insensitive), link auth_user_id on
 * every unlinked matched row, and return all customers so the portal shows
 * tickets from every organisation that knows this person.
 */
export async function resolvePortalCustomers(
  userId: string,
  userEmail: string,
): Promise<PortalCustomer[]> {
  const admin = createAdminClient();

  // 1. Fast path: already linked
  try {
    const { data: linked } = await admin
      .from("customers")
      .select("id, name, email, org_id")
      .eq("auth_user_id", userId);

    if (linked && linked.length > 0) {
      return await attachOrgNames(admin, linked as { id: string; name: string; email: string; org_id: string }[]);
    }
  } catch {
    // auth_user_id column not present yet — fall through to email lookup
  }

  if (!userEmail) return [];

  // 2. Slow path: find by email (case-insensitive)
  const { data: byEmail, error } = await admin
    .from("customers")
    .select("id, name, email, auth_user_id, org_id")
    .ilike("email", userEmail);

  if (error || !byEmail || byEmail.length === 0) return [];

  // 3. Link unlinked rows so next login is instant
  const unlinkedIds = byEmail
    .filter((c: { auth_user_id: string | null }) => !c.auth_user_id)
    .map((c: { id: string }) => c.id);

  if (unlinkedIds.length > 0) {
    try {
      await admin
        .from("customers")
        .update({ auth_user_id: userId })
        .in("id", unlinkedIds);
    } catch {
      // auth_user_id column not present — linking skipped
    }
  }

  return await attachOrgNames(admin, byEmail as { id: string; name: string; email: string; org_id: string }[]);
}

async function attachOrgNames(
  admin: ReturnType<typeof createAdminClient>,
  customers: { id: string; name: string; email: string; org_id: string }[],
): Promise<PortalCustomer[]> {
  const orgIds = [...new Set(customers.map((c) => c.org_id))];
  const { data: orgs } = await admin
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);

  const orgMap = new Map((orgs ?? []).map((o: { id: string; name: string }) => [o.id, o.name]));

  return customers.map((c) => ({
    id:       c.id,
    name:     c.name,
    email:    c.email,
    org_id:   c.org_id,
    org_name: orgMap.get(c.org_id) ?? "Support",
  }));
}
