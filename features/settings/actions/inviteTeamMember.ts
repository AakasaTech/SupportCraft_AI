"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail } from "@/lib/resend";
import { inviteTeamMemberSchema } from "../schemas";
import { canAddAgent, getPlanLimits, PLAN_NAMES, resolveEffectivePlan } from "@/lib/plans";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export async function inviteTeamMember(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { organizationId: true, role: true, fullName: true },
  });

  if (!profile || !["owner", "admin"].includes(profile.role)) {
    return { error: "Only admins can invite team members" };
  }

  const org = await prisma.organization.findUnique({
    where: { id: profile.organizationId },
    select: { name: true, plan: true, freepassPlan: true, freepassUntil: true },
  });

  if (!org) return { error: "Organization not found" };

  const effectivePlan = resolveEffectivePlan({
    plan: org.plan,
    freepass_plan: org.freepassPlan,
    freepass_until: org.freepassUntil?.toISOString() ?? null,
  });

  const currentAgentCount = await prisma.profile.count({
    where: { organizationId: profile.organizationId },
  });

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

  const existing = await prisma.invitation.findFirst({
    where: {
      organizationId: profile.organizationId,
      email: parsed.data.email,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (existing) {
    return { error: "An active invitation already exists for this email" };
  }

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: profile.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: userId,
      expiresAt: new Date(Date.now() + SEVEN_DAYS_MS),
    },
    select: { token: true },
  });

  await sendInvitationEmail({
    to: parsed.data.email,
    inviterName: profile.fullName,
    orgName: org.name,
    token: invitation.token,
    role: parsed.data.role,
  });

  revalidatePath("/settings/team");
  return { success: true };
}

export async function revokeInvitation(invitationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.invitation.delete({ where: { id: invitationId } });

  revalidatePath("/settings/team");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { id: true, organizationId: true, role: true },
  });

  if (!profile || profile.role !== "owner") {
    return { error: "Only the owner can remove members" };
  }

  // memberId is a Profile.id, not a User.id — compare against the caller's own profile.
  if (memberId === profile.id) {
    return { error: "You cannot remove yourself" };
  }

  await prisma.profile.deleteMany({
    where: { id: memberId, organizationId: profile.organizationId },
  });

  revalidatePath("/settings/team");
  return { success: true };
}
