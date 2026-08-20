import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export interface ApiAuthContext {
  orgId: string;
  keyId: string;
}

/**
 * Validates a Bearer token from the Authorization header.
 * Returns the org context, or null if the key is missing/invalid/revoked/expired.
 */
export async function validateApiKey(authHeader: string | null): Promise<ApiAuthContext | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7).trim();
  if (!key) return null;

  const hash = createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where:  { keyHash: hash },
    select: { id: true, organizationId: true, revokedAt: true, expiresAt: true },
  });

  if (!apiKey) return null;
  if (apiKey.revokedAt) return null;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

  // Update lastUsedAt in the background — don't await to keep latency low
  prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return { orgId: apiKey.organizationId, keyId: apiKey.id };
}
