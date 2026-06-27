"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle, Trash2 } from "lucide-react";
import { LoadingIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading,
  variant = "default",
  children,
}: ConfirmationDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      {children && <AlertDialog.Trigger asChild>{children}</AlertDialog.Trigger>}
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm animate-fade-in" />
        <AlertDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-md rounded-2xl border border-border bg-popover p-6",
            "elevation-modal animate-scale-in"
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "p-2 rounded-xl shrink-0",
                variant === "destructive"
                  ? "bg-destructive-subtle text-destructive"
                  : "bg-warning-subtle text-warning-foreground"
              )}
            >
              {variant === "destructive" ? (
                <Trash2 size={18} aria-hidden />
              ) : (
                <AlertTriangle size={18} aria-hidden />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <AlertDialog.Title className="text-base font-semibold text-foreground">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {description}
              </AlertDialog.Description>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-secondary text-secondary-foreground",
                  "hover:bg-secondary-hover transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                disabled={isLoading}
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>

            <AlertDialog.Action asChild>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  await onConfirm();
                }}
                disabled={isLoading}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:opacity-60 disabled:cursor-not-allowed transition-opacity",
                  variant === "destructive"
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-primary text-primary-foreground hover:bg-primary-hover"
                )}
              >
                {isLoading && <LoadingIcon size={14} />}
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
