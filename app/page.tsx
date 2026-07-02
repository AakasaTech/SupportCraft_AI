import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Brain,
  TrendingUp,
  Users,
  BookOpen,
  Inbox,
  BarChart3,
  Globe,
  Headphones,
  Clock,
  Star,
  MessageSquare,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { PricingSection } from "@/components/shared/PricingSection";

export const metadata: Metadata = {
  title: "SupportCraft AI — AI-Powered Help Desk Software",
  description:
    "Resolve tickets faster with AI-drafted replies, a smart knowledge base, and real-time team collaboration. Built for modern support teams.",
};

const APP_URL = "https://supportcraft.aakasa.dev";

const softwareAppSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SupportCraft AI",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "AI-powered customer support platform for freelancers, agencies, and growing businesses. Manage tickets, draft AI replies, and collaborate as a team.",
  "url": APP_URL,
  "image": `${APP_URL}/android-chrome-512x512.png`,
  "creator": {
    "@type": "Organization",
    "name": "Aakasa Digital",
    "url": "https://aakasa.dev",
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "description": "Get started at no cost. No credit card required.",
      "price": "0",
      "priceCurrency": "USD",
    },
    {
      "@type": "Offer",
      "name": "Freelancer",
      "description": "Everything a solo professional needs to handle customer support.",
      "price": "9",
      "priceCurrency": "USD",
    },
    {
      "@type": "Offer",
      "name": "Startup",
      "description": "The complete toolkit for a growing support team.",
      "price": "19",
      "priceCurrency": "USD",
    },
    {
      "@type": "Offer",
      "name": "Business",
      "description": "Advanced AI and workflows for high-volume teams.",
      "price": "39",
      "priceCurrency": "USD",
    },
    {
      "@type": "Offer",
      "name": "Agency",
      "description": "Manage multiple clients from one powerful platform.",
      "price": "79",
      "priceCurrency": "USD",
    },
  ],
};

// ─── Feature strip ────────────────────────────────────────────────────────────

const featureStrip = [
  { icon: Brain,      title: "AI Reply Drafts",      sub: "GPT-4o drafts in one click" },
  { icon: Inbox,      title: "Unified Inbox",         sub: "All channels, one place" },
  { icon: TrendingUp, title: "Real-time Analytics",   sub: "CSAT, SLA & volume trends" },
  { icon: Shield,     title: "Secure & Compliant",    sub: "SOC 2 ready, 256-bit TLS" },
];

// ─── How it works ─────────────────────────────────────────────────────────────

const steps = [
  {
    number:      "01",
    title:       "Ticket arrives",
    description: "Customers submit via portal, email, or chat. Tickets are auto-tagged by topic, priority, and sentiment using AI.",
  },
  {
    number:      "02",
    title:       "AI drafts the reply",
    description: "Your agent sees a full reply draft — grounded in your knowledge base — ready to review and send in seconds.",
  },
  {
    number:      "03",
    title:       "Resolve & learn",
    description: "Close the ticket, measure CSAT, and let SupportCraft update your knowledge base so the next ticket is even faster.",
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────

const features = [
  {
    icon:        Sparkles,
    title:       "AI Reply Drafts",
    description: "Click once and get a full, contextual reply grounded in your knowledge base. Agents review and send — no blank-page anxiety.",
  },
  {
    icon:        BookOpen,
    title:       "Smart Knowledge Base",
    description: "Publish articles that double as AI context. Customers self-serve; agents get smarter suggestions. One source of truth.",
  },
  {
    icon:        Globe,
    title:       "Customer Portal",
    description: "Customers track their tickets via a branded portal with magic-link login. Zero friction, full transparency.",
  },
  {
    icon:        Users,
    title:       "Team Collaboration",
    description: "Invite agents, assign roles (owner/admin/agent/viewer), and collaborate with internal notes on every ticket.",
  },
  {
    icon:        BarChart3,
    title:       "Analytics & CSAT",
    description: "Track open/resolved counts, first-response time, CSAT scores, and AI usage — all in a live dashboard.",
  },
  {
    icon:        Headphones,
    title:       "Omnichannel Inbox",
    description: "Email, portal, and API integrations feed into one inbox. Routing rules send each ticket to the right agent instantly.",
  },
];


// ─── Ticket list for hero mockup ──────────────────────────────────────────────

const DEMO_TICKETS = [
  { id: "#1084", title: "Can't log in after password reset", status: "open",     priority: "high",   age: "2m" },
  { id: "#1083", title: "Billing charge not reflected",      status: "pending",  priority: "medium", age: "18m" },
  { id: "#1082", title: "Feature request: dark mode",        status: "resolved", priority: "low",    age: "1h" },
];

const STATUS_PILL: Record<string, string> = {
  open:     "bg-blue-50 text-blue-700",
  pending:  "bg-amber-50 text-amber-700",
  resolved: "bg-green-50 text-green-700",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
    />
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/">
            <Image src="/logo.png" alt="SupportCraft AI" width={340} height={96} priority />
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#about"         className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link href="#features"      className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works"  className="text-sm text-muted-foreground hover:text-foreground transition-colors">How it works</Link>
            <Link href="#pricing"       className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/faq"           className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
            <Link href="/portal/login"  className="text-sm text-muted-foreground hover:text-foreground transition-colors">Support portal</Link>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">
              Sign in
            </Link>
            <Link href="/register" className="sc-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">
              Start free trial
            </Link>
          </div>
        </nav>
      </header>

      <main>

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden px-6 pt-20 pb-0 sm:pt-28">

          {/* Background radial glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 80% at 75% 40%, oklch(0.42 0.18 264 / 0.08) 0%, transparent 65%)," +
                "radial-gradient(ellipse 50% 50% at 20% -5%, oklch(0.52 0.22 280 / 0.06) 0%, transparent 60%)",
            }}
          />

          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-12">

              {/* ── Left: copy ─────────────────────────────────────────────── */}
              <div className="pb-16 lg:pb-28">

                {/* Badge */}
                <div
                  className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold"
                  style={{
                    borderColor: "oklch(0.42 0.18 264 / 0.25)",
                    background:  "oklch(0.42 0.18 264 / 0.08)",
                    color:       "oklch(0.42 0.18 264)",
                  }}
                >
                  <Sparkles className="h-3 w-3" />
                  AI-Powered Help Desk Software
                </div>

                {/* Headline */}
                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-[3.5rem] lg:leading-[1.15]">
                  Faster Support.
                  <br />
                  <span
                    style={{
                      background:           "linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.52 0.22 280) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor:  "transparent",
                      backgroundClip:       "text",
                    }}
                  >
                    Happier Customers.
                  </span>
                </h1>

                {/* Description */}
                <p className="mt-6 max-w-[480px] text-lg leading-relaxed text-muted-foreground">
                  SupportCraft AI is a cloud-based customer support help desk platform for businesses,
                  agencies, and freelancers. Manage support tickets, collaborate as a team, and use
                  AI to draft faster replies — all in one place.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/register"
                    className="sc-btn-primary inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold"
                  >
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: "oklch(0.42 0.18 264 / 0.10)" }}
                    >
                      <Zap
                        className="h-2.5 w-2.5"
                        style={{ color: "oklch(0.42 0.18 264)" }}
                      />
                    </span>
                    See how it works
                  </Link>
                </div>

                {/* Trust line */}
                <p className="mt-5 text-sm text-muted-foreground">
                  Free forever · No credit card required · Setup in 2 minutes
                </p>
              </div>

              {/* ── Right: dashboard mockup ─────────────────────────────────── */}
              <div className="relative pb-12 lg:pb-20">

                {/* Floating card — AI Reply Ready (top-right) */}
                <div className="absolute -right-2 -top-4 z-20 flex items-center gap-2.5 rounded-2xl border border-border bg-white px-4 py-3 shadow-lg sm:-right-4 lg:-right-6">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "oklch(0.42 0.18 264 / 0.10)" }}
                  >
                    <Sparkles className="h-4 w-4" style={{ color: "oklch(0.42 0.18 264)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">AI Reply Ready</p>
                    <p className="text-[10px] text-muted-foreground">Draft in 0.8 seconds</p>
                  </div>
                </div>

                {/* Main dashboard card */}
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-slate-200/80">

                  {/* Window chrome */}
                  <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                      </div>
                      <span className="ml-2 text-xs font-semibold text-foreground">Support Dashboard</span>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Live</span>
                  </div>

                  {/* KPI grid */}
                  <div className="grid grid-cols-2 gap-3 p-4">

                    {/* Open Tickets — brand gradient */}
                    <div
                      className="rounded-xl p-4 text-white"
                      style={{ background: "linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.52 0.22 280) 100%)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3 w-3 opacity-75" />
                        <p className="text-[10px] font-medium uppercase tracking-wide opacity-80">Open Tickets</p>
                      </div>
                      <p className="mt-2 text-xl font-bold">24</p>
                      <p className="mt-0.5 text-[10px] opacity-70">↓ 8 vs yesterday</p>
                    </div>

                    {/* Resolved Today — green */}
                    <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <p className="text-[10px] font-medium uppercase tracking-wide text-green-700">Resolved Today</p>
                      </div>
                      <p className="mt-2 text-xl font-bold text-green-900">18</p>
                      <p className="mt-0.5 text-[10px] text-green-600">avg. 4m reply time</p>
                    </div>

                    {/* AI Time Saved — amber */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-amber-600" />
                        <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700">AI Saves</p>
                      </div>
                      <p className="mt-2 text-xl font-bold text-amber-900">3.2 h</p>
                      <p className="mt-0.5 text-[10px] text-amber-600">saved today by AI</p>
                    </div>

                    {/* CSAT */}
                    <div className="rounded-xl bg-muted p-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3 w-3 text-muted-foreground" />
                        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">CSAT</p>
                      </div>
                      <p className="mt-2 text-xl font-bold">98%</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">last 30 days</p>
                    </div>
                  </div>

                  {/* Mini ticket list */}
                  <div className="px-4 pb-4 space-y-1.5">
                    <p className="text-[10px] font-medium text-muted-foreground mb-2">Recent tickets</p>
                    {DEMO_TICKETS.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-[10px] font-mono text-muted-foreground w-10 shrink-0">{t.id}</span>
                        <span className="flex-1 truncate text-[11px] font-medium">{t.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold capitalize ${STATUS_PILL[t.status]}`}>
                          {t.status}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{t.age}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating card — Ticket Resolved (bottom-left) */}
                <div className="absolute -bottom-3 -left-2 z-20 flex items-center gap-2.5 rounded-2xl border border-border bg-white px-4 py-3 shadow-lg sm:-left-4 lg:-left-8">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-100">
                    <Check className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-green-700 leading-tight">Ticket Resolved</p>
                    <p className="text-[10px] text-muted-foreground">CSAT: ⭐⭐⭐⭐⭐</p>
                  </div>
                </div>

                {/* Floating card — Knowledge Base (bottom-right) */}
                <div className="absolute -right-2 bottom-8 z-20 flex items-center gap-2.5 rounded-2xl border border-border bg-white px-4 py-3 shadow-lg sm:-right-4 lg:-right-8">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: "oklch(0.42 0.18 264 / 0.10)" }}
                  >
                    <BookOpen className="h-4 w-4" style={{ color: "oklch(0.42 0.18 264)" }} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">KB matched</p>
                    <p className="text-[10px] text-muted-foreground">3 articles used</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── Feature icon strip ───────────────────────────────────────────────── */}
        <section className="border-y border-border bg-muted/30 px-6 py-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {featureStrip.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── About ────────────────────────────────────────────────────────────── */}
        <section id="about" className="px-6 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              What is SupportCraft AI?
            </h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">
              SupportCraft AI is a web-based customer support help desk application that lets
              businesses and teams manage customer inquiries in one place. Support agents can
              create and track tickets, reply to customers, collaborate with teammates using
              internal notes, and publish a self-service knowledge base.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The platform uses AI (OpenAI GPT-4o) to automatically categorise incoming tickets
              by priority and topic, and to generate reply drafts that agents can review and
              send in seconds. A built-in analytics dashboard tracks response times, ticket
              volumes, and customer satisfaction scores in real time.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Sign-in with Google is offered purely for account authentication — we request only
              your name and email address and use them solely to create and identify your account.
              We do not access any other Google data. See our{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground transition-colors">
                Privacy Policy
              </Link>{" "}
              for full details.
            </p>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                From ticket to resolution in minutes
              </h2>
              <p className="mt-4 text-muted-foreground">
                AI handles the heavy lifting so your team can focus on the human touch.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="relative">
                  <div className="text-6xl font-bold tabular-nums" style={{ color: "oklch(0.42 0.18 264 / 0.12)" }}>
                    {step.number}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────────────── */}
        <section id="features" className="border-t border-border bg-muted/30 px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your support team needs
              </h2>
              <p className="mt-4 text-muted-foreground">
                Built around how support actually works — not how ticket software thinks it should.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Social proof strip ───────────────────────────────────────────────── */}
        <section className="border-t border-border px-6 py-16">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-6 sm:grid-cols-3 text-center">
              {[
                { stat: "4 min",  label: "average first reply time with AI drafts" },
                { stat: "98%",    label: "average CSAT score across Pro teams" },
                { stat: "3.5 h",  label: "saved per agent per day using AI replies" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <p
                    className="text-4xl font-bold"
                    style={{
                      background:           "linear-gradient(135deg, oklch(0.42 0.18 264) 0%, oklch(0.52 0.22 280) 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor:  "transparent",
                      backgroundClip:       "text",
                    }}
                  >
                    {item.stat}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────────────────────── */}
        <PricingSection />

        {/* ── CTA strip ────────────────────────────────────────────────────────── */}
        <section className="border-t border-border px-6 py-20 text-center">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to transform your support?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free forever for small teams. Upgrade when you&apos;re ready. No contracts, cancel anytime.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="sc-btn-primary inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-semibold"
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/portal/login"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground shadow-sm hover:bg-muted transition-colors"
            >
              <Headphones className="h-4 w-4" />
              Customer portal
            </Link>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/app_icon.png" alt="SupportCraft AI" width={28} height={28} className="rounded-md" />
            <span className="text-sm font-semibold">SupportCraft AI</span>
            <span className="text-xs text-muted-foreground">by Aakasa Digital</span>
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SupportCraft AI. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/portal/login" className="hover:text-foreground transition-colors">Customer portal</Link>
            <Link href="/privacy"      className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link href="/terms"        className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
    </>
  );
}
