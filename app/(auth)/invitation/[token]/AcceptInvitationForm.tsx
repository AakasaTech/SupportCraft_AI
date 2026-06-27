"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { acceptInvitation, acceptInvitationExistingUser } from "@/features/auth/actions/invitation";

interface Props {
  token: string;
  email: string;
}

type TabMode = "new" | "existing";

export function AcceptInvitationForm({ token, email }: Props) {
  const [mode, setMode] = useState<TabMode>("new");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("token", token);

    startTransition(async () => {
      const action = mode === "new" ? acceptInvitation : acceptInvitationExistingUser;
      const result = await action(formData);
      if (result?.error) {
        if (result.error === "expired") {
          window.location.href = "/invitation-expired";
          return;
        }
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Join your team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Accept the invitation to get started
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => { setMode("new"); setError(null); }}
          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
            mode === "new"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-hover"
          }`}
        >
          New account
        </button>
        <button
          type="button"
          onClick={() => { setMode("existing"); setError(null); }}
          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
            mode === "existing"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-hover"
          }`}
        >
          I have an account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pre-filled email (read-only) */}
        <div className="space-y-1.5">
          <Label htmlFor="inv-email">Email</Label>
          <Input id="inv-email" type="email" value={email} disabled className="opacity-60" />
        </div>

        {mode === "new" && (
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Your full name</Label>
            <Input
              id="fullName"
              name="fullName"
              placeholder="Jane Smith"
              required
              minLength={2}
              autoFocus
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="inv-password">
            {mode === "new" ? "Create a password" : "Your password"}
          </Label>
          <Input
            id="inv-password"
            name="password"
            type="password"
            placeholder={mode === "new" ? "Min. 8 chars, 1 uppercase, 1 number" : "••••••••"}
            autoComplete={mode === "new" ? "new-password" : "current-password"}
            required
            minLength={8}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <Loader2 className="animate-spin" />}
          {mode === "new" ? "Create account & join" : "Sign in & join"}
        </Button>
      </form>
    </div>
  );
}
