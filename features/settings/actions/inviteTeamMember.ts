"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendInvitationEmail } from "@/lib/resend";
import { inviteTeamMemberSchema } from "../schemas";
import { canAddAgent, getPlanLimits, PLAN_NAMES, resolveEffectivePlan } from "@/lib/plans";
import type { OrgPlan } from "@/types/database";

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { error: "Only admins can invite team members" };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("name, plan, freepass_plan, freepass_until")
    .eq("id", profile.org_id)
    .single();

  if (!org) return { error: "Organization not found" };

  const effectivePlan = resolveEffectivePlan({ plan: org.plan as OrgPlan, freepass_plan: org.freepass_plan ?? null, freepass_until: org.freepass_until ?? null });

  const { data: members, count: memberCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact" })
    .eq("org_id", profile.org_id);

  const currentAgentCount = memberCount ?? members?.length ?? 0;
  if (!canAddAgent(effectivePlan, currentAgentCount)) {
    const limit = getPlanLimits(effectivePlan).agents;
    const planName = PLAN_NAMES[effectivePlan];
    return {
      error: `Your ${planName} plan allows a maximum of ${limit} agent${limit === 1 ? "" : "s"}. Upgrade your plan to add more team members.`,
    };
  }

  const parsed = inviteTeamMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role") || "agent",
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { data: existing } = await supabase
    .from("invitations")
    .select("id")
    .eq("org_id", profile.org_id)
    .eq("email", parsed.data.email)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (existing) {
    return { error: "An active invitation already exists for this email" };
  }

  const { data: invitation, error } = await supabase
    .from("invitations")
    .insert({
      org_id: profile.org_id,
      email: parsed.data.email,
      role: parsed.data.role,
      invited_by: user.id,
    })
    .select("token")
    .single();

  if (error) return { error: error.message };

  await sendInvitationEmail({
    to: parsed.data.email,
    inviterName: profile.full_name,
    orgName: org.name,
    token: invitation.token,
    role: parsed.data.role,
  });

  revalidatePath("/settings/team");
  return { success: true };
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("invitations")
    .delete()
    .eq("id", invitationId);

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (memberId === user.id) {
    return { error: "You cannot remove yourself" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can remove members" };
  }

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", memberId)
    .eq("org_id", profile.org_id);

  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { success: true };
}
