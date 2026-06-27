import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Invitation Expired" };

export default function InvitationExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-warning-subtle">
            <Clock size={36} className="text-warning-foreground" aria-hidden />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Invitation expired</h1>
          <p className="text-sm text-muted-foreground">
            This invitation link has expired. Please ask your team administrator to
            send a new invitation.
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
