"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Inbox, MessageSquare, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const DOC_NAV = [
  { href: "/docs/getting-started",    label: "Getting Started",    icon: Rocket        },
  { href: "/docs/tickets",            label: "Tickets",            icon: Inbox         },
  { href: "/docs/replying-to-tickets",label: "Replying to Tickets",icon: MessageSquare },
  { href: "/docs/ai-features",        label: "AI Features",        icon: Sparkles      },
  { href: "/docs/faq",                label: "FAQ",                icon: HelpCircle    },
];

export function DocsSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Documentation navigation">
      <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        Documentation
      </p>
      <ul className="space-y-0.5">
        {DOC_NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={15} className="shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
