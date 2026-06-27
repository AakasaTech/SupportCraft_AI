export interface Tenant {
  slug:  string;
  orgId: string;
}

export interface Env {
  TENANT_MAP:          KVNamespace;
  INBOUND_SECRET:      string;
  SUPABASE_INBOUND_URL: string;
}

/**
 * Strategy A — address prefix: {slug}@supportcraft.aakasa.dev
 * The KV store maps slug → org UUID.
 *
 * Extend here to support Strategy B (wildcard subdomains) without
 * changing the caller interface.
 */
export async function resolveTenant(toAddress: string, env: Env): Promise<Tenant | null> {
  const local = toAddress.split("@")[0]?.toLowerCase();
  if (!local) return null;

  const orgId = await env.TENANT_MAP.get(local);
  if (!orgId) return null;

  return { slug: local, orgId };
}
