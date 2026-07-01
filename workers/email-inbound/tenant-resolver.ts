export interface Tenant {
  slug:  string;
  orgId: string;
}

export interface Env {
  INBOUND_SECRET:           string;
  SUPABASE_INBOUND_URL:     string;
  SUPABASE_URL:             string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

/**
 * Resolve the tenant from the To address by querying Supabase directly.
 * Any slug saved to email_settings.tenant_slug is immediately valid —
 * no manual KV sync required.
 */
export async function resolveTenant(toAddress: string, env: Env): Promise<Tenant | null> {
  const local = toAddress.split("@")[0]?.toLowerCase();
  if (!local) return null;

  const url = `${env.SUPABASE_URL}/rest/v1/email_settings?select=org_id&tenant_slug=eq.${encodeURIComponent(local)}&limit=1`;

  let rows: Array<{ org_id: string }>;
  try {
    const res = await fetch(url, {
      headers: {
        "apikey":        env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
    if (!res.ok) return null;
    rows = await res.json() as Array<{ org_id: string }>;
  } catch {
    return null;
  }

  const orgId = rows[0]?.org_id;
  if (!orgId) return null;

  return { slug: local, orgId };
}
