import type { Metadata } from "next";
import Link from "next/link";
import { Rocket, Inbox, MessageSquare, Sparkles, HelpCircle, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation — SupportCraft AI",
  description: "Guides and reference for SupportCraft AI — get started, manage tickets, reply to customers, use AI features, and more.",
};

const categories = [
  {
    href:        "/docs/getting-started",
    icon:        Rocket,
    title:       "Getting Started",
    description: "Create your account, connect your support email address, and invite your team. Up and running in minutes.",
  },
  {
    href:        "/docs/tickets",
    icon:        Inbox,
    title:       "Tickets",
    description: "How customer emails become tickets, how reply threads stay linked, and how to assign, tag, and prioritise.",
  },
  {
    href:        "/docs/replying-to-tickets",
    icon:        MessageSquare,
    title:       "Replying to Tickets",
    description: "Use the rich text editor, paste inline images, attach files, leave internal notes, @mention teammates, and insert canned responses.",
  },
  {
    href:        "/docs/ai-features",
    icon:        Sparkles,
    title:       "AI Features",
    description: "Draft replies with one click, improve your writing, summarise long threads, and auto-analyse incoming tickets.",
  },
  {
    href:        "/docs/faq",
    icon:        HelpCircle,
    title:       "FAQ",
    description: "Answers to the most common questions about tickets, email, AI features, canned responses, and team management.",
  },
];

export default function DocsIndexPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Documentation</h1>
      <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
        Everything you need to get the most out of SupportCraft AI. Choose a topic below or use the sidebar to jump straight to what you need.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {categories.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground group-hover:text-primary transition-colors">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-xs font-medium text-primary">
              Read guide <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-14 rounded-2xl border border-primary/20 bg-primary-subtle/40 p-8 text-center">
        <p className="text-sm font-semibold text-foreground">Not on SupportCraft AI yet?</p>
        <p className="mt-1 text-sm text-muted-foreground">Free plan available — no credit card required.</p>
        <Link
          href="/register"
          className="sc-btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
        >
          Start for free <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
