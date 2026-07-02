import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ — SupportCraft AI",
  description:
    "Answers to frequently asked questions about SupportCraft AI — pricing, AI features, email setup, team management, and more.",
};

const faqs = [
  {
    question: "What is SupportCraft AI?",
    answer:
      "SupportCraft AI is a cloud-based customer support help desk platform for businesses, agencies, and freelancers. It lets teams manage support tickets, collaborate with agents using internal notes, and use AI to draft faster replies — all from one web-based interface. No software installation is required.",
  },
  {
    question: "Is SupportCraft AI free?",
    answer:
      "Yes. SupportCraft AI offers a Free plan with no credit card required. You get 1 agent seat, up to 50 tickets per month, email support, a customer portal, a knowledge base, and basic AI replies at no cost. Paid plans start at $9/month for the Freelancer plan.",
  },
  {
    question: "What are the paid plan prices?",
    answer:
      "Paid plans are Freelancer at $9/month (or $89/year), Startup at $19/month (or $189/year), Business at $39/month (or $389/year), and Agency at $79/month (or $789/year). Annual billing saves up to 20%. All prices are in USD and you can cancel anytime.",
  },
  {
    question: "What AI features does SupportCraft AI include?",
    answer:
      "SupportCraft AI uses OpenAI GPT-4o to automatically categorise incoming tickets by priority and topic, and to generate full draft replies grounded in your knowledge base. Agents click once to get a reply draft, review and edit if needed, then send in seconds. Higher-tier plans add AI ticket summaries, auto-categorisation, AI-powered knowledge search, and AI suggested responses.",
  },
  {
    question: "Do I need to configure email servers or SMTP?",
    answer:
      "No. SupportCraft AI provides a managed support email address in the format slug@supportcraft.aakasa.dev. Inbound customer emails automatically create tickets, and outbound replies are sent from the same address — no SMTP configuration, MX records, or email server setup required.",
  },
  {
    question: "Can customers track their support tickets?",
    answer:
      "Yes. SupportCraft AI includes a self-service customer portal where customers can submit new tickets, check the status of open tickets, reply to agents, and browse your published knowledge base. Customers log in using a magic link sent to their email — no password is required.",
  },
  {
    question: "How many agents can I add?",
    answer:
      "The Free and Freelancer plans support 1 agent. Startup supports 5 agents, Business supports 15 agents, and the Agency plan supports unlimited agents. You can invite team members by email from Settings → Team, and each person is assigned a role: owner, admin, agent, or viewer.",
  },
  {
    question: "Does SupportCraft AI include a knowledge base?",
    answer:
      "Yes. All plans include a knowledge base where you can publish help articles. Articles serve two purposes: customers can search and self-serve through the portal, and the AI uses your published articles as context when drafting ticket replies — making suggestions more accurate over time.",
  },
  {
    question: "How does the AI reply drafting feature work?",
    answer:
      "When an agent opens a ticket, they can click the AI Generate button in the reply editor. SupportCraft AI sends the ticket content, conversation history, and relevant knowledge base articles to OpenAI GPT-4o, which returns a full draft reply. The agent reviews the draft, edits it if needed, and sends it to the customer.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Yes. All data is encrypted in transit using 256-bit TLS. SupportCraft AI is hosted on secure cloud infrastructure and is built with SOC 2 readiness in mind. We use OAuth 2.0 for Google Sign-In and never store passwords. We request only your name and email address from Google, and use them solely to identify your account. See our Privacy Policy for full details.",
  },
];

const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": faqs.map(({ question, answer }) => ({
    "@type": "Question",
    "name": question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": answer,
    },
  })),
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
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
              <Link href="/#pricing"  className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">Pricing</Link>
              <Link href="/login"     className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:block">Sign in</Link>
              <Link href="/register"  className="sc-btn-primary rounded-lg px-4 py-2 text-sm font-semibold">Start free trial</Link>
            </div>
          </nav>
        </header>

        {/* Content */}
        <main className="mx-auto max-w-3xl px-6 py-16">

          <div className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Frequently Asked Questions</h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Everything you need to know about SupportCraft AI. Can&apos;t find the answer you&apos;re looking for?{" "}
              <a href="mailto:hello@aakasa.dev" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
                Email our support team.
              </a>
            </p>
          </div>

          <div className="space-y-0 divide-y divide-border">
            {faqs.map(({ question, answer }, i) => (
              <div key={i} className="py-8">
                <h2 className="text-base font-semibold text-foreground mb-3">{question}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 rounded-2xl border border-border bg-muted/30 p-8 text-center">
            <h2 className="text-xl font-bold">Ready to get started?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Start free — no credit card required. Upgrade anytime.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/register"
                className="sc-btn-primary inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold"
              >
                Start for free
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Back to home
              </Link>
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer className="border-t border-border px-6 py-8 mt-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} SupportCraft AI by Aakasa Digital. All rights reserved.
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
