import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PortalLoginForm } from "./PortalLoginForm";

export const metadata: Metadata = { title: "Sign in to Support Portal" };

export default function PortalLoginPage() {
  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block opacity-90 hover:opacity-100 transition-opacity">
          <Image src="/logo.png" alt="SupportCraft AI" width={320} height={90} priority className="mx-auto" />
        </Link>
      </div>
      <div className="sc-glass rounded-2xl p-8 shadow-xl space-y-6">
        <div>
          <h1 className="text-xl font-bold">Sign in to get support</h1>
          <p className="text-sm text-muted-foreground mt-1">
            We&apos;ll send you a secure link — no password needed.
          </p>
        </div>
        <PortalLoginForm />
        <p className="text-center text-xs text-muted-foreground">
          Are you a support agent?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Agent sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
