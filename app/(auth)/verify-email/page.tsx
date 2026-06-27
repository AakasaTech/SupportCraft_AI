import type { Metadata } from "next";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifyEmailActions } from "./VerifyEmailActions";

export const metadata: Metadata = { title: "Verify your email" };

export default function VerifyEmailPage() {
  return (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="p-4 rounded-full bg-primary-subtle">
          <Mail size={32} className="text-primary" aria-hidden />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          We sent a verification link to your email address. Click the link to
          activate your account.
        </p>
      </div>

      <div className="sc-card p-4 text-left space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Didn&apos;t receive it?</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the right email address</li>
          <li>Allow a few minutes for the email to arrive</li>
        </ul>
      </div>

      <VerifyEmailActions />

      <Button asChild variant="ghost" size="sm" className="gap-2">
        <Link href="/login">
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </Button>
    </div>
  );
}
