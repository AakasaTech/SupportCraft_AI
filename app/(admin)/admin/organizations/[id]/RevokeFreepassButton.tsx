"use client";

import { useTransition } from "react";
import { revokeFreepassAction } from "@/app/actions/admin";
import { X } from "lucide-react";

export function RevokeFreepassButton({ orgId }: { orgId: string }) {
  const [pending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm("Revoke free pass for this organisation?")) return;
    startTransition(async () => {
      const result = await revokeFreepassAction(orgId);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      onClick={handleRevoke}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
    >
      <X size={13} />
      {pending ? "Revoking…" : "Revoke"}
    </button>
  );
}
