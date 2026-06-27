"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithMagicLink } from "@/features/auth/actions";

export function VerifyEmailActions() {
  const [isPending, startTransition] = useTransition();
  const [showResend, setShowResend] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleResend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setMessage(null);
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      if (result?.error) setMessage({ type: "error", text: result.error });
      if (result?.success) setMessage({ type: "success", text: "Verification email resent!" });
    });
  }

  if (!showResend) {
    return (
      <Button variant="outline" onClick={() => setShowResend(true)}>
        Resend verification email
      </Button>
    );
  }

  return (
    <form onSubmit={handleResend} className="space-y-3">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription
            className={message.type === "success" ? "text-success" : undefined}
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}
      <Input
        name="email"
        type="email"
        placeholder="your@email.com"
        required
        autoFocus
      />
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Resend email
      </Button>
    </form>
  );
}
