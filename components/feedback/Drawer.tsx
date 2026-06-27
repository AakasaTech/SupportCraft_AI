"use client";

import { Drawer as VaulDrawer } from "vaul";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: "right" | "bottom";
  className?: string;
  trigger?: React.ReactNode;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  className,
  trigger,
}: DrawerProps) {
  const isBottom = side === "bottom";

  return (
    <VaulDrawer.Root
      open={open}
      onOpenChange={onOpenChange}
      direction={isBottom ? "bottom" : "right"}
    >
      {trigger && <VaulDrawer.Trigger asChild>{trigger}</VaulDrawer.Trigger>}
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm" />
        <VaulDrawer.Content
          className={cn(
            "fixed z-50 bg-card border-border flex flex-col focus:outline-none",
            isBottom
              ? "bottom-0 left-0 right-0 max-h-[92vh] rounded-t-2xl border-t"
              : "right-0 top-0 bottom-0 w-full max-w-lg rounded-l-2xl border-l elevation-modal",
            className
          )}
        >
          {isBottom && (
            <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border shrink-0" />
          )}

          <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
            <div>
              {title && (
                <VaulDrawer.Title className="text-base font-semibold text-foreground">
                  {title}
                </VaulDrawer.Title>
              )}
              {description && (
                <VaulDrawer.Description className="mt-0.5 text-sm text-muted-foreground">
                  {description}
                </VaulDrawer.Description>
              )}
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className={cn(
                "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5">{children}</div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
