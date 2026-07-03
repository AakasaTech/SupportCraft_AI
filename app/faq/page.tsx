import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ — SupportCraft AI",
  description:
    "Answers to frequently asked questions about SupportCraft AI — pricing, AI features, email setup, team management, and more.",
};

const FAQS = [
  {
    q: "What is SupportCraft AI?",
    a: "SupportCraft AI is a cloud-based customer support help desk platform for businesses, agencies, and freelancers. It lets teams manage support tickets, collaborate with agents using internal notes, and use AI to draft faster replies — all from one web-based interface. No software installation is required.",
  },
  {
    q: "Is SupportCraft AI free?",
    a: "Yes. SupportCraft AI offers a Free plan with no credit card required. You get 1 agent seat, up to 50 tickets per month, email support, a customer portal, a knowledge base, and basic AI replies at no cost. Paid plans start at $9/month for the Freelancer plan.",
  },
  {
    q: "What are the paid plan prices?",
    a: "Paid plans are Freelancer at $9/month (or $89/year), Startup at $19/month (or $189/year), Business at $39/month (or $389/year), and Agency at $79/month (or $789/year). Annual billing saves up to 20%. All prices are in USD and you can cancel anytime.",
  },
  {
    q: "What AI features does SupportCraft AI include?",
    a: "SupportCraft AI uses OpenAI GPT-4o to automatically categorise incoming tickets by priority and topic, and to generate full draft replies grounded in your knowledge base. Agents click once to get a reply draft, review and edit if needed, then send in seconds. Higher-tier plans add AI ticket summaries, auto-categorisation, AI-powered knowledge search, and AI suggested responses.",
  },
  {
    q: "Do I need to configure email servers or SMTP?",
    a: "No. SupportCraft AI provides a managed support email address in the format slug@supportcraft.aakasa.dev. Inbound customer emails automatically create tickets, and outbound replies are sent from the same address — no SMTP configuration, MX records, or email server setup required.",
  },
  {
    q: "Can customers track their support tickets?",
    a: "Yes. SupportCraft AI includes a self-service customer portal where customers can submit new tickets, check the status of open tickets, reply to agents, and browse your published knowledge base. Customers log in using a magic link sent to their email — no password is required.",
  },
  {
    q: "How many agents can I add?",
    a: "The Free and Freelancer plans support 1 agent. Startup supports 5 agents, Business supports 15 agents, and the Agency plan supports unlimited agents. You can invite team members by email from Settings → Team, and each person is assigned a role: owner, admin, agent, or viewer.",
  },
  {
    q: "Does SupportCraft AI include a knowledge base?",
    a: "Yes. All plans include a knowledge base where you can publish help articles. Articles serve two purposes: customers can search and self-serve through the portal, and the AI uses your published articles as context when drafting ticket replies — making suggestions more accurate over time.",
  },
  {
    q: "How does the AI reply drafting feature work?",
    a: "When an agent opens a ticket, they can click the AI Generate button in the reply editor. SupportCraft AI sends the ticket content, conversation history, and relevant knowledge base articles to OpenAI GPT-4o, which returns a full draft reply. The agent reviews the draft, edits it if needed, and sends it to the customer.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is encrypted in transit using 256-bit TLS. SupportCraft AI is hosted on secure cloud infrastructure and is built with SOC 2 readiness in mind. We use OAuth 2.0 for Google Sign-In and never store passwords. We request only your name and email address from Google, and use them solely to identify your account. See our Privacy Policy for full details.",
  },
] as const;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-background text-foreground">

        {/* Nav */}
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-md">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/app_icon.png" alt="SupportCraft AI" width={32} height={32} className="rounded-lg" />
              <span className="font-semibold text-base">SupportCraft AI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/#pricing" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">Pricing</Link>
              <Link href="/login"    className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">Sign in</Link>
              <Link href="/register" className="sc-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">Start free trial</Link>
            </div>
          </nav>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-3xl px-6 py-20">

          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">Frequently asked questions</h1>
            <p className="mt-4 text-muted-foreground">
              Everything you need to know about SupportCraft AI.{" "}
              <Link href="/register" className="text-primary hover:underline">
                Start for free
              </Link>{" "}
              or{" "}
              <a href="mailto:hello@aakasa.dev" className="text-primary hover:underline">
                contact support
              </a>{" "}
              if you have another question.
            </p>
          </div>

          <dl className="divide-y divide-border">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <dt className="text-base font-semibold">{q}</dt>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <dd className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</dd>
              </details>
            ))}
          </dl>

          <div className="mt-16 rounded-2xl border border-primary/20 bg-primary/5 px-8 py-8 text-center">
            <h2 className="text-lg font-semibold">Ready to get started?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Free plan available · No credit card required · Cancel any time
            </p>
            <Link
              href="/register"
              className="sc-btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
            >
              Start for free
            </Link>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-8 mt-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} SupportCraft AI by Aakasa Digital. All rights reserved.
            </p>
            <div className="flex gap-5 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms"   className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
