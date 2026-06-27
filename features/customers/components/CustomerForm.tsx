"use client";

import { useTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createCustomer, updateCustomer } from "../actions";
import { customerSchema, type CustomerInput } from "../schemas";
import type { Customer } from "@/types/database";

interface CustomerFormProps {
  customer?: Customer;
  onSuccess?: (customerId: string) => void;
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          name: customer.name,
          email: customer.email,
          phone: customer.phone ?? undefined,
          company: customer.company ?? undefined,
          notes: customer.notes ?? undefined,
        }
      : {},
  });

  function onSubmit(data: CustomerInput) {
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", data.name);
      formData.set("email", data.email);
      if (data.phone) formData.set("phone", data.phone);
      if (data.company) formData.set("company", data.company);
      if (data.notes) formData.set("notes", data.notes);

      const result = customer
        ? await updateCustomer(customer.id, formData)
        : await createCustomer(formData);

      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("customerId" in result && result.customerId) {
        onSuccess?.(result.customerId);
      } else {
        onSuccess?.(customer!.id);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Jane Smith" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="jane@acme.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="Acme Inc." {...register("company")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register("phone")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Internal notes about this customer…" rows={3} {...register("notes")} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {customer ? "Save changes" : "Add customer"}
        </Button>
      </div>
    </form>
  );
}
