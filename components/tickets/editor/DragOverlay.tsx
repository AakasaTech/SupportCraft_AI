"use client";

import { Upload } from "lucide-react";

export function DragOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Upload size={22} className="text-primary" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-primary">Drop files here</p>
        <p className="text-xs text-muted-foreground">Images will be inserted inline · Other files become attachments</p>
      </div>
    </div>
  );
}
