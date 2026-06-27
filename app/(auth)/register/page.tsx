import type { Metadata } from "next";
import { RegisterForm } from "@/features/auth/components/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Get started free</h1>
        <p className="text-sm text-muted-foreground mt-1">
          No credit card required · Up to 3 agents on the free plan
        </p>
      </div>
      <RegisterForm />
    </>
  );
}
