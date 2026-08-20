import { Suspense } from "react";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account</p>
      </div>

      <Suspense fallback={null}>
        <UpdatePasswordForm />
      </Suspense>
    </>
  );
}
