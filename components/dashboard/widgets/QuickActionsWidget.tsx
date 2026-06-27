import Link from "next/link";
import {
  Plus, UserPlus, BookOpen, BarChart2,
  MessageSquarePlus, Settings, Zap,
} from "lucide-react";

const ACTIONS = [
  {
    label:       "New Ticket",
    description: "Create a ticket manually",
    href:        "/tickets/new",
    Icon:        Plus,
    cls:         "bg-primary-subtle text-primary hover:bg-primary hover:text-white",
  },
  {
    label:       "Add Customer",
    description: "Register a new customer",
    href:        "/customers/new",
    Icon:        UserPlus,
    cls:         "bg-muted text-foreground hover:bg-primary-subtle hover:text-primary",
  },
  {
    label:       "Write Article",
    description: "Add to your knowledge base",
    href:        "/knowledge-base/new",
    Icon:        BookOpen,
    cls:         "bg-muted text-foreground hover:bg-primary-subtle hover:text-primary",
  },
  {
    label:       "Invite Agent",
    description: "Grow your support team",
    href:        "/settings/team",
    Icon:        MessageSquarePlus,
    cls:         "bg-muted text-foreground hover:bg-primary-subtle hover:text-primary",
  },
  {
    label:       "View Reports",
    description: "Analyze team performance",
    href:        "/tickets?view=reports",
    Icon:        BarChart2,
    cls:         "bg-muted text-foreground hover:bg-primary-subtle hover:text-primary",
  },
  {
    label:       "AI Settings",
    description: "Configure AI suggestions",
    href:        "/settings",
    Icon:        Zap,
    cls:         "bg-ai-subtle text-ai hover:bg-ai hover:text-white",
  },
  {
    label:       "Settings",
    description: "Org & notification settings",
    href:        "/settings",
    Icon:        Settings,
    cls:         "bg-muted text-foreground hover:bg-primary-subtle hover:text-primary",
  },
] as const;

export function QuickActionsWidget() {
  return (
    <div className="sc-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">Quick Actions</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Common tasks at a glance</p>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {ACTIONS.map(({ label, description, href, Icon, cls }) => (
          <Link
            key={label}
            href={href}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-xl text-center transition-all duration-150 group ${cls}`}
          >
            <div className="p-2 rounded-lg bg-white/20 group-hover:bg-white/30 transition-colors">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight">{label}</p>
              <p className="text-[10px] opacity-70 mt-0.5 leading-tight hidden sm:block">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
