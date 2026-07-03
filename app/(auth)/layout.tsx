import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen sc-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2 opacity-90 hover:opacity-100 transition-opacity">
            <Image src="/logo.png" alt="SupportCraft AI" width={320} height={90} priority />
            <p className="text-sm text-muted-foreground">
              by <span className="font-medium text-foreground">Aakasa Digital</span>
            </p>
          </Link>
        </div>
        <div className="sc-glass rounded-2xl p-8 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
