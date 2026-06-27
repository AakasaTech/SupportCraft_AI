"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { customerSchema } from "../schemas";

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  if (!profile) return { error: "Profile not found" };

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { data: customer, error } = await supabase
    .from("customers")
    .insert({ ...parsed.data, org_id: profile.org_id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/customers");
  return { customerId: customer.id };
}

export async function updateCustomer(customerId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    company: formData.get("company") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { error } = await supabase
    .from("customers")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", customerId);

  if (error) return { error: error.message };

  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/customers");
  return { success: true };
}

export async function deleteCustomer(customerId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", customerId);

  if (error) return { error: error.message };

  revalidatePath("/customers");
  return { success: true };
}
