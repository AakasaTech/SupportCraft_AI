"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "../schemas";

export async function createCustomer(formData: FormData) {
  const user = await requireAuth();

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const customer = await prisma.customer.create({
    data: { ...parsed.data, organizationId: user.profile.organizationId },
    select: { id: true },
  });

  revalidatePath("/customers");
  return { customerId: customer.id };
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const user = await requireAuth();

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  // Scope to this agent's org — without it, any authenticated agent could edit
  // another org's customer by guessing/URL-tampering the id (Prisma has no RLS
  // to fall back on, unlike the Supabase client this replaced).
  const { count } = await prisma.customer.updateMany({
    where: { id: customerId, organizationId: user.profile.organizationId },
    data:  parsed.data,
  });

  if (count === 0) return { error: "Customer not found" };

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomer(customerId: string) {
  const user = await requireAuth();

  const { count } = await prisma.customer.deleteMany({
    where: { id: customerId, organizationId: user.profile.organizationId },
  });

  if (count === 0) return { error: "Customer not found" };

  revalidatePath("/customers");
  return { success: true };
}
