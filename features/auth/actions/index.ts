"use server";

import { randomBytes, createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail, getEmailFrom } from "@/lib/email/mailer";
import { slugify } from "@/lib/utils";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from "../schemas";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function signIn(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await nextAuthSignIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw e;
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    orgName: formData.get("orgName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { fullName, orgName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists" };

  try {
    const passwordHash = await hashPassword(password);
    const slug = `${slugify(orgName)}-${Math.random().toString(36).slice(2, 7)}`;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash } });
      const org = await tx.organization.create({ data: { name: orgName, slug } });
      await tx.profile.create({
        data: {
          userId: user.id,
          organizationId: org.id,
          role: "owner",
          fullName,
          email,
        },
      });
      await tx.subscription.create({
        data: { organizationId: org.id, plan: "free", status: "active" },
      });
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Registration failed. Please try again." };
  }

  try {
    await nextAuthSignIn("credentials", { email, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Account created — please sign in." };
    }
    throw e;
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut() {
  await nextAuthSignOut({ redirect: false });
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Always report success, whether or not the account exists — avoids leaking
  // account existence to an unauthenticated caller.
  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/update-password?token=${rawToken}`;
    const from = `SupportCraft AI <${getEmailFrom()}>`;
    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a1a;">Reset your password</h2>
        <p style="color:#555;">Click the button below to set a new password. This link expires in 1 hour and can only be used once.</p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#6d28d9;color:#fff;padding:12px 24px;
                  border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Reset password
        </a>
        <p style="color:#999;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;
    const text = `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour and can only be used once.`;

    await sendEmail({ from, to: user.email!, subject: "Reset your SupportCraft AI password", html, text });
  }

  return { success: "Check your email for the password reset link" };
}

export async function signInWithGoogleAction() {
  await nextAuthSignIn("google", { redirectTo: "/dashboard" });
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email");
  if (!email || typeof email !== "string") return { error: "Email is required" };

  try {
    await nextAuthSignIn("email", {
      email,
      redirect: false,
      redirectTo: "/portal/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Could not send the magic link. Please try again." };
    }
    throw e;
  }

  return { success: "Check your email for the magic link" };
}

export async function updatePassword(formData: FormData) {
  const parsed = updatePasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await prisma.user.update({
    where: { id: resetToken.userId },
    data: { passwordHash },
  });
  await prisma.passwordResetToken.update({
    where: { id: resetToken.id },
    data: { usedAt: new Date() },
  });

  try {
    await nextAuthSignIn("credentials", {
      email: user.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      redirect("/login");
    }
    throw e;
  }

  redirect("/dashboard");
}
