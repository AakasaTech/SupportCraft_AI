"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Search,
  LayoutDashboard,
  Ticket,
  Users,
  BookOpen,
  Settings,
  Plus,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  group: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const isOpen   = controlledOpen ?? open;
  const setIsOpen = onOpenChange ?? setOpen;

  const navigate = useCallback((path: string) => {
    setIsOpen(false);
    router.push(path);
  }, [router, setIsOpen]);

  const items: CommandItem[] = [
    { id: "dashboard",    label: "Dashboard",            icon: <LayoutDashboard size={14} />, group: "Navigate", onSelect: () => navigate("/dashboard") },
    { id: "tickets",      label: "Tickets",              icon: <Ticket size={14} />,          group: "Navigate", onSelect: () => navigate("/tickets") },
    { id: "customers",    label: "Customers",            icon: <Users size={14} />,            group: "Navigate", onSelect: () => navigate("/customers") },
    { id: "kb",           label: "Knowledge Base",       icon: <BookOpen size={14} />,        group: "Navigate", onSelect: () => navigate("/knowledge-base") },
    { id: "settings",     label: "Settings",             icon: <Settings size={14} />,        group: "Navigate", onSelect: () => navigate("/settings") },
    { id: "billing",      label: "Billing",              icon: <CreditCard size={14} />,      group: "Navigate", onSelect: () => navigate("/settings/billing") },
    { id: "new-ticket",   label: "New Ticket",           icon: <Plus size={14} />,            group: "Actions",  onSelect: () => navigate("/tickets?new=1") },
    { id: "new-customer", label: "New Customer",         icon: <Plus size={14} />,            group: "Actions",  onSelect: () => navigate("/customers/new") },
    { id: "new-article",  label: "New Knowledge Article",icon: <Plus size={14} />,            group: "Actions",  onSelect: () => navigate("/knowledge-base/new") },
    { id: "ai-suggest",   label: "AI Suggest Reply",     icon: <Sparkles size={14} />,        group: "AI",       onSelect: () => setIsOpen(false) },
    { id: "team",         label: "Team Settings",        icon: <Settings size={14} />,        group: "Navigate", onSelect: () => navigate("/settings/team") },
  ];

  const groups = Array.from(new Set(items.map((i) => i.group)));

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [setIsOpen, isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-[20%] z-50 -translate-x-1/2",
            "w-full max-w-lg rounded-xl border border-border",
            "bg-popover elevation-modal overflow-hidden",
            "animate-scale-in"
          )}
          aria-label="Command palette"
        >
          <Command className="flex flex-col" shouldFilter>
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <Command.Input
                placeholder="Search commands, pages, tickets…"
                className={cn(
                  "flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground",
                  "outline-none border-none ring-0"
                )}
                autoFocus
              />
              <kbd className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border font-mono">
                ESC
              </kbd>
            </div>

            <Command.List className="max-h-80 overflow-y-auto p-2">
              <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {groups.map((group) => (
                <Command.Group
                  key={group}
                  heading={group}
                  className="[&_[cmdk-group-heading]]:text-label [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:mb-1"
                >
                  {items
                    .filter((item) => item.group === group)
                    .map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.keywords?.join(" ") ?? ""}`}
                        onSelect={item.onSelect}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer",
                          "text-foreground",
                          "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground",
                          "transition-colors"
                        )}
                      >
                        <span className="text-muted-foreground data-[selected=true]:text-primary-foreground/70">
                          {item.icon}
                        </span>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {item.description}
                          </span>
                        )}
                      </Command.Item>
                    ))}
                </Command.Group>
              ))}
            </Command.List>

            <div className="border-t border-border px-4 py-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                <kbd className="font-mono">↑↓</kbd> navigate&nbsp;&nbsp;
                <kbd className="font-mono">↵</kbd> select&nbsp;&nbsp;
                <kbd className="font-mono">esc</kbd> close
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <kbd className="font-mono bg-muted px-1 rounded border border-border">⌘K</kbd>
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Trigger button ───────────────────────────────────── */
interface CommandPaletteTriggerProps {
  onClick: () => void;
  className?: string;
}

export function CommandPaletteTrigger({ onClick, className }: CommandPaletteTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-1.5",
        "bg-muted border border-border text-muted-foreground text-sm",
        "hover:bg-hover hover:text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label="Open command palette"
    >
      <Search size={14} />
      <span className="hidden sm:block">Search…</span>
      <kbd className="hidden sm:flex items-center gap-0.5 text-xs font-mono bg-background border border-border rounded px-1 ml-1">
        ⌘K
      </kbd>
    </button>
  );
}
