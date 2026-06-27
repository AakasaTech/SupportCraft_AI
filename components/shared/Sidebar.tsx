"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TicketCheck,
  Users,
  BookOpen,
  Settings,
  LogOut,
  CreditCard,
  LayoutDashboard,
  Sparkles,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { signOut } from "@/features/auth/actions";
import type { Profile, Organization } from "@/types/database";

const NAV_ITEMS = [
  { href: "/dashboard",      label: "Dashboard",      icon: LayoutDashboard },
  { href: "/tickets",        label: "Tickets",        icon: TicketCheck },
  { href: "/customers",      label: "Customers",      icon: Users },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/email",          label: "Email",          icon: Mail         },
  { href: "/ai",             label: "AI Platform",    icon: Sparkles     },
  { href: "/settings",       label: "Settings",       icon: Settings },
];

interface SidebarProps {
  profile: Profile;
  organization: Organization;
}

export function Sidebar({ profile, organization }: SidebarProps) {
  const pathname = usePathname();

  const initials = profile.full_name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "sc-sidebar w-16 lg:w-60 transition-all duration-200 shrink-0",
          "elevation-low"
        )}
      >
        {/* Logo / Org */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-sidebar-border">
          <div className="h-8 w-8 sc-gradient-primary rounded-lg flex items-center justify-center shrink-0 elevation-low">
            <Sparkles className="h-4 w-4 text-white" aria-hidden />
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {organization.name}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {organization.plan} plan
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/dashboard"
              ? pathname === href
              : pathname.startsWith(href);
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary-subtle text-primary"
                        : "text-muted-foreground hover:bg-hover hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="hidden lg:block">{label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="lg:hidden">
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings/billing"
                aria-current={pathname.startsWith("/settings/billing") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname.startsWith("/settings/billing")
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground"
                )}
              >
                <CreditCard className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden lg:block">Billing</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="lg:hidden">Billing</TooltipContent>
          </Tooltip>

          <form action={signOut}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="submit"
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive-subtle hover:text-destructive transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="hidden lg:block">Sign out</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="lg:hidden">Sign out</TooltipContent>
            </Tooltip>
          </form>

          <div className="flex items-center justify-between gap-2 px-3 py-2 mt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.full_name} />
                <AvatarFallback className="text-xs bg-primary-subtle text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {profile.full_name}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
              </div>
            </div>
            <div className="shrink-0 hidden lg:block">
              <ThemeToggle size="sm" />
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
