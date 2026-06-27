import type { Metadata } from "next";
import Link from "next/link";
import { Unlink, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Invalid Invitation" };

export default function InvitationInvalidPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive-subtle">
            <Unlink size={36} className="text-destructive" aria-hidden />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Invalid invitation</h1>
          <p className="text-sm text-muted-foreground">
            This invitation link is not valid or has already been used. Ask your
            team administrator for a new invitation.
          </p>
        </div>

        <Button asChild variant="outline" className="gap-2">
          <Link href="/login">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </Button>
      </div>
    </div>
  );
}
