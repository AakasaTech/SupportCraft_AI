import type { Metadata } from "next";
import Link from "next/link";
import { ShieldX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Access Denied" };

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive-subtle">
            <ShieldX size={36} className="text-destructive" aria-hidden />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            You don&apos;t have permission to view this page. Contact your organization
            administrator if you believe this is a mistake.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="gap-2">
            <Link href="/login">
              <ArrowLeft size={14} />
              Sign in with a different account
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
