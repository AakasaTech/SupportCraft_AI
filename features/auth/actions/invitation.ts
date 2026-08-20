"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const acceptSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function acceptInvitation(formData: FormData) {
  const parsed = acceptSchema.safeParse({
    token: formData.get("token"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { token, fullName, password } = parsed.data;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) return { error: "Invalid invitation link" };
  if (invitation.acceptedAt) return { error: "This invitation has already been used" };
  if (invitation.expiresAt < new Date()) return { error: "expired" };

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) {
    return { error: "An account with this email already exists. Please sign in and join via the invitation link." };
  }

  try {
    const passwordHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: invitation.email, passwordHash },
      });
      await tx.profile.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          fullName,
          email: invitation.email,
        },
      });
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Setup failed. Please try again." };
  }

  const result = await signIn("credentials", { email: invitation.email, password, redirect: false });
  if (result?.error) return { error: "Account created — please sign in." };

  redirect("/dashboard");
}

export async function acceptInvitationExistingUser(formData: FormData) {
  const token = formData.get("token");
  const password = formData.get("password");

  if (!token || typeof token !== "string") return { error: "Invalid token" };
  if (!password || typeof password !== "string") return { error: "Password is required" };

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation) return { error: "Invalid invitation link" };
  if (invitation.acceptedAt) return { error: "This invitation has already been used" };
  if (invitation.expiresAt < new Date()) return { error: "expired" };

  const user = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (!user?.passwordHash) return { error: "No account found for this email" };

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return { error: "Incorrect password" };

  try {
    // Switching orgs is not supported; only add a profile if none exists yet.
    const existingProfile = await prisma.profile.findUnique({ where: { userId: user.id } });
    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          organizationId: invitation.organizationId,
          role: invitation.role,
          fullName: user.email?.split("@")[0] ?? invitation.email.split("@")[0],
          email: invitation.email,
        },
      });
    }

    await prisma.invitation.update({
      where: { id: invitation.id },
      data: { acceptedAt: new Date() },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed. Please try again." };
  }

  const result = await signIn("credentials", { email: invitation.email, password, redirect: false });
  if (result?.error) return { error: "Joined — please sign in." };

  redirect("/dashboard");
}

// Fetch invitation details for display (no auth required)
export async function getInvitationByToken(token: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: { organization: { select: { name: true, slug: true } } },
    });
    return invitation;
  } catch {
    return null;
  }
}
