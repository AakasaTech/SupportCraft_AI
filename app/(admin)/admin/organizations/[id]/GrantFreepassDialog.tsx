"use client";

import { useState, useTransition } from "react";
import { grantFreepassAction } from "@/app/actions/admin";
import { PLAN_NAMES } from "@/lib/plans";
import type { OrgPlan } from "@/lib/generated/prisma/client";
import { BadgeCheck, X } from "lucide-react";

const PLANS: OrgPlan[] = ["pro", "business"];

const DURATIONS = [
  { label: "7 days",   days: 7   },
  { label: "30 days",  days: 30  },
  { label: "90 days",  days: 90  },
  { label: "1 year",   days: 365 },
  { label: "Permanent", days: null },
];

interface Props {
  orgId:              string;
  currentFreepassPlan: OrgPlan | null;
}

export function GrantFreepassDialog({ orgId, currentFreepassPlan }: Props) {
  const [open, setOpen]         = useState(false);
  const [plan, setPlan]         = useState<OrgPlan>(currentFreepassPlan ?? "pro");
  const [duration, setDuration] = useState<number | null>(30);
  const [pending, startTransition] = useTransition();
  const [error, setError]       = useState<string | null>(null);

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await grantFreepassAction(orgId, plan, duration);
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 px-3 py-1.5 text-xs font-medium transition-colors"
      >
        <BadgeCheck size={13} />
        {currentFreepassPlan ? "Update Free Pass" : "Grant Free Pass"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl border border-border shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">
                {currentFreepassPlan ? "Update Free Pass" : "Grant Free Pass"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Plan selector */}
            <label className="block text-sm font-medium mb-1.5">Plan</label>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PLANS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    plan === p
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {PLAN_NAMES[p]}
                </button>
              ))}
            </div>

            {/* Duration selector */}
            <label className="block text-sm font-medium mb-1.5">Duration</label>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {DURATIONS.map(({ label, days }) => (
                <button
                  key={label}
                  onClick={() => setDuration(days)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    duration === days
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-sm text-destructive mb-3">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={pending}
                className="flex-1 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {pending ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
