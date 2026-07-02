import type { Metadata } from "next";
import Link from "next/link";
import { DocsBreadcrumb } from "../_components/DocsBreadcrumb";

export const metadata: Metadata = {
  title: "FAQ — SupportCraft AI Docs",
  description: "Common questions about SupportCraft AI — email setup, ticket threading, internal notes, AI features, canned responses, and team management.",
};

const faqs = [
  {
    q: "How does a customer email become a ticket?",
    a: "When a customer sends an email to your support address (e.g. acme@supportcraft.aakasa.dev), SupportCraft AI receives it and automatically creates a new ticket. The email subject becomes the ticket title, the body becomes the first message, and the customer receives an acknowledgement email with the ticket number. You don't need to do anything to trigger this — it happens the moment the email arrives.",
    related: null,
  },
  {
    q: "Will customers ever see internal notes I add to a ticket?",
    a: "No. Internal notes are completely hidden from customers — they are never sent by email and never appear in the customer portal. Only agents logged in to your SupportCraft AI workspace can see them. The editor shows a clear yellow background and a warning banner when you're in Internal Note mode so you always know before you send.",
    related: "/docs/replying-to-tickets",
  },
  {
    q: "What happens when a customer replies to one of my support emails?",
    a: "SupportCraft AI recognises the reply as belonging to the existing ticket and adds it to the ticket's conversation thread — no new ticket is created. This works because every outgoing email carries a hidden conversation tag that email apps automatically include when the customer clicks Reply. If the customer starts a brand-new email on the same topic, SupportCraft AI uses the ticket number in the subject line as a fallback to route it correctly.",
    related: "/docs/tickets",
  },
  {
    q: "Can I use my own email domain (like support@mycompany.com)?",
    a: "Not yet. Currently, SupportCraft AI assigns a subdomain address in the format slug@supportcraft.aakasa.dev. Custom domain email routing is planned for a future release. In the meantime, you can include your branding by setting a Display Name (e.g. \"Acme Support\") in Settings → Email so customers see your company name instead of the raw address.",
    related: "/docs/getting-started",
  },
  {
    q: "How do I change the automatic acknowledgement email that customers receive?",
    a: "Go to Settings → Email → Email Templates. You'll find the Ticket Acknowledgement template with an editable subject line and body. You can use placeholder variables like {{customer_name}} and {{ticket_number}} which are filled in automatically for each ticket. Toggle the template off if you'd prefer not to send acknowledgements.",
    related: null,
  },
  {
    q: "Can I assign tickets to specific agents?",
    a: "Yes. Open any ticket and look at the Ticket Info panel on the right. Click the Assigned to field and choose any agent in your workspace from the dropdown. Assigning a ticket doesn't restrict other agents from viewing or replying — it's a visual indicator of who is responsible.",
    related: "/docs/tickets",
  },
  {
    q: "How do I create canned responses?",
    a: "Go to Settings → Canned Responses and click New canned response. Give it a name (e.g. \"Refund policy\"), a short shortcut (e.g. \"refund\"), and write the reply body. Once saved, any agent can insert it from the Canned button in the reply editor footer. You can create as many as you need.",
    related: "/docs/replying-to-tickets",
  },
  {
    q: "What's the difference between AI Reply Draft and AI Suggested Responses?",
    a: "AI Reply Draft (available on all plans) generates a complete, multi-sentence reply for any ticket — grounded in the ticket content and your knowledge base. You choose a tone and click Generate. AI Suggested Responses (Business+ plans) surfaces shorter, quick-pick options for common ticket patterns. Both appear in the AI Assistant panel on the right side of the ticket view.",
    related: "/docs/ai-features",
  },
  {
    q: "Is there a monthly limit on AI features?",
    a: "Yes. Each plan has a monthly quota of AI calls, shared across all agents in your workspace. You can see exactly how many calls you've used this month at AI Platform in the main menu. If you reach the limit, AI features pause until the next billing cycle. Upgrading your plan increases the quota.",
    related: "/docs/ai-features",
  },
  {
    q: "How do I invite someone to my workspace?",
    a: "Go to Settings → Team and click Invite. Enter the person's email address and choose a role — Admin, Agent, or Viewer. They'll receive an email with a secure link. When they click it and create their account (or log in with Google), they're added to your workspace automatically with the role you selected.",
    related: "/docs/getting-started",
  },
];

const faqPageSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function DocsFaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
      />

      <article>
        <DocsBreadcrumb crumbs={[{ label: "FAQ", href: "/docs/faq" }]} />

        <h1 className="text-3xl font-bold tracking-tight text-foreground">Frequently asked questions</h1>
        <p className="mt-3 text-muted-foreground leading-relaxed">
          Can&apos;t find what you&apos;re looking for?{" "}
          <a href="mailto:hello@aakasa.dev" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
            Email our support team
          </a>{" "}
          and we&apos;ll get back to you.
        </p>

        <div className="mt-10 space-y-0 divide-y divide-border">
          {faqs.map(({ q, a, related }) => (
            <div key={q} className="py-7">
              <h2 className="text-base font-semibold text-foreground">{q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a}</p>
              {related && (
                <Link
                  href={related}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline underline-offset-4"
                >
                  Read the full guide →
                </Link>
              )}
            </div>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-primary/20 bg-primary-subtle/30 p-8 text-center">
          <p className="text-sm font-semibold text-foreground">Ready to try SupportCraft AI?</p>
          <p className="mt-1 text-sm text-muted-foreground">Free plan available — no credit card required.</p>
          <Link
            href="/register"
            className="sc-btn-primary mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold"
          >
            Start for free
          </Link>
        </div>
      </article>
    </>
  );
}
