export interface Tenant {
  slug:  string;
  orgId: string;
}

export interface Env {
  INBOUND_SECRET: string;
  APP_URL:        string;
}

/**
 * Resolve the tenant from the To address by asking the Next.js app, which
 * looks it up in Neon. Any slug saved to email_settings.tenant_slug is
 * immediately valid — no manual KV sync required.
 */
export async function resolveTenant(toAddress: string, env: Env): Promise<Tenant | null> {
  const local = toAddress.split("@")[0]?.toLowerCase();
  if (!local) return null;

  const url = `${env.APP_URL}/api/email/resolve-tenant?slug=${encodeURIComponent(local)}`;

  try {
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${env.INBOUND_SECRET}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { orgId?: string };
    if (!data.orgId) return null;
    return { slug: local, orgId: data.orgId };
  } catch {
    return null;
  }
}
