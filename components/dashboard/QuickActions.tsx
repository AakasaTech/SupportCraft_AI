import Link from "next/link";
import { Plus, BookOpen, Users, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "ai";
}

const actions: QuickAction[] = [
  { label: "New Ticket",    description: "Create a support ticket",    href: "/tickets?new=1",        icon: Plus,     variant: "primary" },
  { label: "New Customer",  description: "Add a customer record",       href: "/customers/new",        icon: Users,    variant: "default" },
  { label: "New Article",   description: "Write a knowledge article",   href: "/knowledge-base/new",   icon: BookOpen, variant: "default" },
  { label: "AI Suggest",    description: "Get an AI reply suggestion",  href: "/tickets",              icon: Sparkles, variant: "ai" },
];

interface QuickActionsProps {
  className?: string;
}

export function QuickActions({ className }: QuickActionsProps) {
  return (
    <div className={cn("sc-card overflow-hidden", className)}>
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
      </div>
      <ul className="divide-y divide-border" role="list">
        {actions.map((action) => (
          <li key={action.label}>
            <Link
              href={action.href}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-hover transition-colors group"
            >
              <div
                className={cn(
                  "p-2 rounded-lg shrink-0",
                  action.variant === "primary" && "bg-primary-subtle text-primary",
                  action.variant === "ai"      && "sc-ai-badge",
                  action.variant === "default" && "bg-muted text-muted-foreground"
                )}
              >
                <action.icon size={16} aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
