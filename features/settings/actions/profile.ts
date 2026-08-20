"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { updateProfileSchema, type UpdateProfileInput } from "../schemas";

export async function updateProfile(input: UpdateProfileInput): Promise<{ error?: string }> {
  const user = await requireAuth();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.profile.update({
    where: { id: user.profile.id },
    data: {
      fullName: parsed.data.fullName,
      phone:    parsed.data.phone || null,
      jobTitle: parsed.data.job_title || null,
      timezone: parsed.data.timezone || "UTC",
      language: parsed.data.language || "en",
    },
  });

  revalidatePath("/settings");
  return {};
}
