import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen sc-hero-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SC</span>
            </div>
            <span className="font-semibold text-lg">SupportCraft AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            by{" "}
            <span className="font-medium text-foreground">Aakasa Digital</span>
          </p>
        </div>
        <div className="sc-glass rounded-2xl p-8 shadow-xl">{children}</div>
      </div>
    </div>
  );
}
