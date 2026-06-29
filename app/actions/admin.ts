"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyAdmin } from "@/lib/admin-auth";
import type { OrgPlan } from "@/types/database";

// ─── Grant / update free pass ────────────────────────────────────────────────

export async function grantFreepassAction(
  orgId:         string,
  plan:          OrgPlan,
  durationDays:  number | null  // null = permanent
) {
  await verifyAdmin();

  const until = durationDays
    ? new Date(Date.now() + durationDays * 86_400_000).toISOString()
    : null;

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ freepass_plan: plan, freepass_until: until })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/organizations");
  return { success: true };
}

// ─── Revoke free pass ─────────────────────────────────────────────────────────

export async function revokeFreepassAction(orgId: string) {
  await verifyAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ freepass_plan: null, freepass_until: null })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/organizations");
  return { success: true };
}

// ─── Toggle user active / suspended ──────────────────────────────────────────

export async function toggleUserActiveAction(userId: string, isActive: boolean) {
  await verifyAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/admin/users");
  return { success: true };
}

// ─── Force plan change ────────────────────────────────────────────────────────

export async function forceOrgPlanAction(orgId: string, plan: OrgPlan) {
  await verifyAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update({ plan })
    .eq("id", orgId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/organizations/${orgId}`);
  revalidatePath("/admin/organizations");
  return { success: true };
}
