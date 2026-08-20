"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyAdmin } from "@/lib/admin-auth";
import type { OrgPlan } from "@/lib/generated/prisma/client";

type Result = { success?: true; error?: string };

// ─── Grant / update free pass ────────────────────────────────────────────────

export async function grantFreepassAction(
  orgId:         string,
  plan:          OrgPlan,
  durationDays:  number | null  // null = permanent
): Promise<Result> {
  await verifyAdmin();

  const until = durationDays
    ? new Date(Date.now() + durationDays * 86_400_000)
    : null;

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data:  { freepassPlan: plan, freepassUntil: until },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to grant free pass" };
  }

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/organizations");
  return { success: true };
}

// ─── Revoke free pass ─────────────────────────────────────────────────────────

export async function revokeFreepassAction(orgId: string): Promise<Result> {
  await verifyAdmin();

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data:  { freepassPlan: null, freepassUntil: null },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to revoke free pass" };
  }

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/organizations");
  return { success: true };
}

// ─── Toggle user active / suspended ──────────────────────────────────────────

export async function toggleUserActiveAction(userId: string, isActive: boolean): Promise<Result> {
  await verifyAdmin();

  try {
    // `userId` here is a Profile.id (the admin users table lists profiles).
    await prisma.profile.update({
      where: { id: userId },
      data:  { isActive },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update user" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Force plan change ────────────────────────────────────────────────────────

export async function forceOrgPlanAction(orgId: string, plan: OrgPlan): Promise<Result> {
  await verifyAdmin();

  try {
    await prisma.organization.update({
      where: { id: orgId },
      data:  { plan },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to change plan" };
  }

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/organizations");
  return { success: true };
}
