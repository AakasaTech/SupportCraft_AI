"use client";

import { useTransition } from "react";
import { toggleUserActiveAction } from "@/app/actions/admin";

interface Props {
  userId:   string;
  isActive: boolean;
}

export function ToggleActiveButton({ userId, isActive }: Props) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleUserActiveAction(userId, !isActive);
      if (result?.error) alert(result.error);
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
        isActive
          ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
          : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
      }`}
    >
      {pending ? "…" : isActive ? "Suspend" : "Enable"}
    </button>
  );
}
