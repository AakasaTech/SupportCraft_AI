"use client";

import { useState, useTransition } from "react";
import { History, RotateCcw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { restoreVersion } from "@/features/knowledge-base/actions";
import { useRouter } from "next/navigation";

interface Version {
  id:             string;
  version_number: number;
  change_summary: string | null;
  created_at:     string;
}

interface Props {
  articleId: string;
  versions:  Version[];
  current:   number;
}

export function VersionHistory({ articleId, versions, current }: Props) {
  const router = useRouter();
  const [expanded,  setExpanded]  = useState(false);
  const [restoring, setRestoring] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRestore = (versionNumber: number) => {
    if (!confirm(`Restore to version ${versionNumber}? Current changes will be saved as a new version.`)) return;
    setRestoring(versionNumber);
    startTransition(async () => {
      await restoreVersion(articleId, versionNumber);
      router.refresh();
      setRestoring(null);
    });
  };

  const sorted = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="sc-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-hover transition-colors border-b border-border"
      >
        <History size={14} className="text-muted-foreground" />
        <span className="text-xs font-semibold flex-1 text-left">Version History</span>
        <span className="text-[11px] text-muted-foreground">v{current}</span>
        {expanded ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="divide-y divide-border max-h-64 overflow-y-auto">
          {sorted.map((ver) => (
            <div key={ver.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-hover/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-foreground">v{ver.version_number}</span>
                  {ver.version_number === current && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">current</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{ver.change_summary ?? "Updated"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(ver.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              {ver.version_number !== current && (
                <button
                  type="button"
                  onClick={() => handleRestore(ver.version_number)}
                  disabled={isPending}
                  title="Restore this version"
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0"
                >
                  {restoring === ver.version_number
                    ? <Loader2 size={12} className="animate-spin" />
                    : <RotateCcw size={12} />}
                </button>
              )}
            </div>
          ))}
          {versions.length === 0 && (
            <p className="px-4 py-4 text-xs text-muted-foreground text-center">No version history yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
