"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import { updatePortalProfile } from "@/features/tickets/actions/portalActions";
import type { PortalCustomer } from "@/lib/portal/customer";

interface Props {
  customer: PortalCustomer;
  email: string;
}

export function PortalProfileForm({ customer, email }: Props) {
  const [isPending, startTransition] = useTransition();
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaved(false);
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updatePortalProfile(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">{error}</p>
      )}
      {saved && (
        <p className="flex items-center gap-2 text-sm text-success bg-success-subtle rounded-xl px-4 py-3">
          <Check size={14} /> Profile updated successfully.
        </p>
      )}

      <div>
        <label htmlFor="name" className="text-sm font-medium text-foreground block mb-1.5">
          Full Name
        </label>
        <input
          id="name"
          type="text"
          name="name"
          required
          defaultValue={customer.name}
          placeholder="Your full name"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground text-foreground"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-xs text-muted-foreground mt-1">Email is managed via your authentication provider.</p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
