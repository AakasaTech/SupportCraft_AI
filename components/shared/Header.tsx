"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { CommandPalette, CommandPaletteTrigger } from "@/components/navigation/CommandPalette";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export function Header({ title, description, actions, breadcrumb, className }: HeaderProps) {
  const [cmdOpen, setCmdOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "h-14 border-b border-border bg-background/80 backdrop-blur-md",
          "flex items-center justify-between gap-4 px-4 sm:px-6",
          "sticky top-0 z-40",
          className
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          {breadcrumb ?? (
            <div className="min-w-0">
              {title && (
                <h1 className="text-sm font-semibold text-foreground truncate">{title}</h1>
              )}
              {description && (
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {actions}
          <CommandPaletteTrigger onClick={() => setCmdOpen(true)} />

          <button
            className={cn(
              "relative h-9 w-9 flex items-center justify-center rounded-lg",
              "text-muted-foreground hover:text-foreground hover:bg-hover transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label="Notifications"
          >
            <Bell size={16} />
          </button>

          <ThemeToggle size="sm" />
        </div>
      </header>

      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </>
  );
}
