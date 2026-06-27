import type { Metadata } from "next";
import { PortalHeader } from "./PortalHeader";

export const metadata: Metadata = {
  title: { default: "Support Portal", template: "%s | Support Portal" },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-16">{children}</main>
    </div>
  );
}
