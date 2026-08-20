import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/helpers";
import { getCannedResponses } from "@/features/settings/actions/cannedResponses";
import { CannedResponsesManager } from "@/features/settings/components/CannedResponsesManager";

export const metadata: Metadata = { title: "Canned Responses | SupportCraft" };

export default async function CannedResponsesPage() {
  await requireAuth();

  const items = await getCannedResponses();

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Settings
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="text-xl font-bold text-foreground">Canned Responses</h1>
      </div>

      <p className="text-sm text-muted-foreground -mt-2">
        Pre-written replies your team can insert instantly in the ticket composer using the{" "}
        <span className="font-medium text-foreground">Canned</span> button or by typing{" "}
        <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">#shortcut</span>.
      </p>

      <CannedResponsesManager initial={items} />
    </div>
  );
}
