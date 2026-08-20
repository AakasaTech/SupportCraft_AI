"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";

type Result<T = Record<string, never>> = { data?: T; error?: string };

async function getCtx() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!["owner", "admin"].includes(user.profile.role)) return null;

  return { userId: user.id, profileId: user.profile.id, orgId: user.profile.organizationId };
}

export async function generateApiKeyAction(
  name: string,
): Promise<Result<{ id: string; key: string; prefix: string }>> {
  if (!name?.trim()) return { error: "Name is required" };

  const ctx = await getCtx();
  if (!ctx) return { error: "Unauthorized" };

  // sc_live_ + 32 random hex chars = 40 chars total
  const random = randomBytes(16).toString("hex"); // 32 hex
  const key    = `sc_live_${random}`;             // full key shown once
  const prefix = `${key.slice(0, 16)}…`;           // "sc_live_AbCd1234…" for display
  const hash   = createHash("sha256").update(key).digest("hex");

  const created = await prisma.apiKey.create({
    data: {
      organizationId: ctx.orgId,
      createdById:    ctx.profileId,
      name:           name.trim(),
      keyPrefix:      prefix,
      keyHash:        hash,
    },
    select: { id: true },
  });

  revalidatePath("/settings/api");
  return { data: { id: created.id, key, prefix } };
}

export async function revokeApiKeyAction(keyId: string): Promise<Result> {
  const ctx = await getCtx();
  if (!ctx) return { error: "Unauthorized" };

  await prisma.apiKey.updateMany({
    where: { id: keyId, organizationId: ctx.orgId },
    data:  { revokedAt: new Date() },
  });

  revalidatePath("/settings/api");
  return { data: {} };
}
