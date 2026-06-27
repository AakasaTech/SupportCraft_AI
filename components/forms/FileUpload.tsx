"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import { Upload, X, File, Image } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadedFile {
  file: File;
  preview?: string;
}

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  onChange?: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function FileUpload({
  accept = "*",
  multiple = false,
  maxSizeMB = 10,
  onChange,
  disabled,
  className,
  id,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFiles(rawFiles: FileList | null) {
    if (!rawFiles) return;
    setError(null);

    const valid: UploadedFile[] = [];
    for (const file of Array.from(rawFiles)) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" exceeds ${maxSizeMB}MB limit.`);
        continue;
      }
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      valid.push({ file, preview });
    }

    const next = multiple ? [...files, ...valid] : valid;
    setFiles(next);
    onChange?.(next.map((f) => f.file));
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onChange?.(next.map((f) => f.file));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) processFiles(e.dataTransfer.files);
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    processFiles(e.target.files);
    e.target.value = "";
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload files"
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !disabled) inputRef.current?.click(); }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8",
          "text-center transition-colors cursor-pointer",
          isDragging
            ? "border-primary bg-primary-subtle"
            : "border-border hover:border-border-strong hover:bg-hover",
          disabled && "opacity-60 cursor-not-allowed pointer-events-none"
        )}
      >
        <div className="p-3 rounded-xl bg-muted">
          <Upload size={20} className="text-muted-foreground" aria-hidden />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Drop files here or <span className="text-primary">browse</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Max {maxSizeMB}MB{accept !== "*" ? ` · ${accept}` : ""}
          </p>
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="sr-only"
          disabled={disabled}
          tabIndex={-1}
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2" role="list" aria-label="Uploaded files">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              {f.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.preview} alt={f.file.name} className="h-8 w-8 rounded object-cover shrink-0" />
              ) : f.file.type.startsWith("image/") ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image size={16} className="text-muted-foreground shrink-0" aria-hidden />
              ) : (
                <File size={16} className="text-muted-foreground shrink-0" aria-hidden />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(f.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                aria-label={`Remove ${f.file.name}`}
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
