"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithMagicLink } from "@/features/auth/actions";

export function PortalLoginForm() {
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      if (result?.error) setError(result.error);
      if (result?.success) setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-success-subtle">
            <Mail size={24} className="text-success" aria-hidden />
          </div>
        </div>
        <p className="font-medium">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent you a sign-in link. Click it to access your support tickets.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="portal-email">Your email address</Label>
        <Input
          id="portal-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          autoFocus
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Send sign-in link
      </Button>
    </form>
  );
}
