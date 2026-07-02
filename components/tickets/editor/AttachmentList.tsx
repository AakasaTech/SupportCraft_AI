"use client";

import { FileText, Table, Video, Archive, File, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Attachment } from "./types";

function formatSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type }: { type: string }) {
  if (type.includes("pdf") || type.includes("word") || type.includes("document"))
    return <FileText size={13} className="text-muted-foreground shrink-0" />;
  if (type.includes("sheet") || type.includes("excel") || type.includes("csv"))
    return <Table size={13} className="text-muted-foreground shrink-0" />;
  if (type.includes("video"))
    return <Video size={13} className="text-muted-foreground shrink-0" />;
  if (type.includes("zip") || type.includes("archive") || type.includes("tar"))
    return <Archive size={13} className="text-muted-foreground shrink-0" />;
  return <File size={13} className="text-muted-foreground shrink-0" />;
}

interface Props {
  attachments: Attachment[];
  onRemove:   (id: string) => void;
}

export function AttachmentList({ attachments, onRemove }: Props) {
  if (!attachments.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 py-2 border-t border-border">
      {attachments.map((att) => (
        <div
          key={att.id}
          className={cn(
            "relative flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs max-w-[240px]",
            att.status === "error" && "border-destructive/40 bg-destructive/5"
          )}
        >
          <FileIcon type={att.fileType} />

          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-foreground leading-tight">{att.filename}</p>
            <p className={cn("text-[10px] leading-tight", att.status === "error" ? "text-destructive" : "text-muted-foreground")}>
              {att.status === "error"
                ? "Upload failed"
                : att.status === "uploading"
                  ? `Uploading ${att.uploadProgress.toFixed(0)}%`
                  : formatSize(att.fileSize)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="ml-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Remove ${att.filename}`}
          >
            <X size={11} />
          </button>

          {/* Progress bar */}
          {att.status === "uploading" && (
            <div className="absolute bottom-0 left-0 h-[2px] w-full overflow-hidden rounded-b-lg bg-border">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${att.uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
