"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  name: string;
  email: string;
  avatarUrl?: string;
  onSignOut: () => void;
  onSettingsClick?: () => void;
  onProfileClick?: () => void;
}

export function UserMenu({
  name,
  email,
  avatarUrl,
  onSignOut,
  onSettingsClick,
  onProfileClick,
}: UserMenuProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5",
            "hover:bg-hover transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          aria-label="User menu"
        >
          <Avatar initials={initials} avatarUrl={avatarUrl} size="sm" />
          <span className="hidden lg:flex flex-col items-start min-w-0">
            <span className="text-sm font-medium text-foreground truncate max-w-32">
              {name}
            </span>
          </span>
          <ChevronDown size={14} className="text-muted-foreground shrink-0 hidden lg:block" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            "z-50 min-w-52 rounded-xl border border-border bg-popover p-1",
            "elevation-dropdown animate-scale-in origin-top-right"
          )}
          align="end"
          sideOffset={6}
        >
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-foreground truncate">{name}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>

          <DropdownMenu.Separator className="sc-divider my-1" />

          <DropdownMenu.Item asChild>
            <button
              onClick={onProfileClick}
              className="sc-dropdown-item"
            >
              <User size={14} className="shrink-0" />
              Profile
            </button>
          </DropdownMenu.Item>

          <DropdownMenu.Item asChild>
            <button
              onClick={onSettingsClick}
              className="sc-dropdown-item"
            >
              <Settings size={14} className="shrink-0" />
              Settings
            </button>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="sc-divider my-1" />

          <DropdownMenu.Item asChild>
            <button
              onClick={onSignOut}
              className="sc-dropdown-item text-destructive focus:bg-destructive-subtle"
            >
              <LogOut size={14} className="shrink-0" />
              Sign out
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Avatar ──────────────────────────────────────────── */
interface AvatarProps {
  initials: string;
  avatarUrl?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ initials, avatarUrl, size = "md", className }: AvatarProps) {
  const sizeClass = {
    sm: "h-7 w-7 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  }[size];

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center shrink-0 font-medium",
        "bg-primary/10 text-primary border border-primary/20",
        sizeClass,
        className
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={initials}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}
