"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { updateOrgSchema, type UpdateOrgInput } from "../schemas";

export async function updateOrganization(input: UpdateOrgInput): Promise<{ error?: string }> {
  const user = await requireAuth();
  if (!["owner", "admin"].includes(user.profile.role)) return { error: "Unauthorized" };

  const parsed = updateOrgSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  await prisma.organization.update({
    where: { id: user.profile.organizationId },
    data: {
      name:     parsed.data.name,
      website:  parsed.data.website || null,
      country:  parsed.data.country || null,
      timezone: parsed.data.timezone || "UTC",
    },
  });

  revalidatePath("/settings");
  return {};
}
