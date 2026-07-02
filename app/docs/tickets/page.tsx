import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocsBreadcrumb } from "../_components/DocsBreadcrumb";

export const metadata: Metadata = {
  title: "Tickets — SupportCraft AI Docs",
  description: "Learn how customer emails become tickets, how reply threads stay linked, and how to assign, tag, and prioritise tickets in SupportCraft AI.",
};

export default function TicketsPage() {
  return (
    <article>

      <DocsBreadcrumb crumbs={[{ label: "Tickets", href: "/docs/tickets" }]} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground">Tickets</h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        Every customer request in SupportCraft AI is a <strong>ticket</strong>. Tickets can be created automatically from inbound email, or manually by an agent. This page explains the full ticket lifecycle.
      </p>

      {/* ── Section 1 ── */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">How tickets are created from email</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          When a customer sends an email to your support address (e.g. <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">acme@supportcraft.aakasa.dev</code>), SupportCraft AI receives it and automatically:
        </p>
        <ol className="mt-4 space-y-3 text-sm text-muted-foreground list-none">
          {[
            "Creates a new ticket with the email subject as the ticket title.",
            "Assigns the ticket a unique number like SUP-1001 (sequential, never reused).",
            "Adds the email body as the first message in the ticket conversation.",
            "Sends the customer an acknowledgement email with the ticket number in the subject line, so they know their request was received.",
            "Adds the customer to your Customers list if they haven't contacted you before.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: "oklch(0.42 0.18 264)" }}
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The ticket list view showing several tickets with their SUP-xxxx numbers, statuses, and priority badges]
        </div>
      </section>

      {/* ── Section 2 ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">How reply threads stay linked</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          When your agent sends a reply from a ticket, the outgoing email carries a hidden &quot;conversation tag&quot; in its headers. When the customer hits <strong>Reply</strong> in their email app, that tag comes back with their response — and SupportCraft AI uses it to route the new email directly into the same ticket instead of opening a new one.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          This means the entire conversation — the original request, your agent&apos;s replies, the customer&apos;s follow-ups — stays in one place, in chronological order, no matter how many times the email goes back and forth.
        </p>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>Good to know:</strong> If a customer opens a brand-new email (instead of replying to an existing one) about the same topic, SupportCraft AI will usually detect the ticket number in the subject line (e.g. <code className="rounded bg-amber-100 px-1 py-0.5 text-xs font-mono">[Ticket #SUP-1001]</code>) and add the message to the existing ticket. If no match is found, a new ticket is created.
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: A ticket detail view showing the full conversation thread — customer message, agent reply, customer follow-up — all in one view]
        </div>
      </section>

      {/* ── Section 3 ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">Ticket statuses</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Each ticket has a status that reflects where it is in your workflow:
        </p>
        <ul className="mt-4 space-y-2.5">
          {[
            { status: "Open",     color: "bg-blue-100 text-blue-700",   desc: "The customer is waiting for a response. Newly created tickets start here." },
            { status: "Pending",  color: "bg-amber-100 text-amber-700", desc: "You're waiting on the customer (e.g. you've asked a follow-up question). Counts differently in reports." },
            { status: "Resolved", color: "bg-green-100 text-green-700", desc: "The issue is fixed. The customer can still reply to re-open the ticket." },
            { status: "Closed",   color: "bg-muted text-muted-foreground", desc: "Fully archived. No further replies expected." },
          ].map(({ status, color, desc }) => (
            <li key={status} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${color}`}>{status}</span>
              <span>{desc}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Section 4 ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">Assigning, tagging, and prioritising</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The right-hand panel on any ticket lets you adjust these fields at any time:
        </p>

        <div className="mt-5 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Assignee</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pick any agent in your workspace from the <strong>Assigned to</strong> dropdown. Unassigned tickets are visible to all agents. Assigned tickets still appear in the shared inbox but are highlighted for the responsible agent.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Priority</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose from <strong>Low</strong>, <strong>Medium</strong>, <strong>High</strong>, or <strong>Urgent</strong>. Priority is visible in the ticket list and can be used to sort or filter. The{" "}
              <Link href="/docs/ai-features" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">AI Analyse feature</Link>{" "}
              can suggest a priority automatically.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Category</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A free-text field for grouping tickets by topic (e.g. &quot;Billing&quot;, &quot;Technical&quot;, &quot;Onboarding&quot;). Useful for filtering the ticket list and tracking trends in your reports.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add multiple tags to a ticket for finer-grained organisation. Tags are free-form and searchable. For example, you might tag a ticket with both &quot;billing&quot; and &quot;urgent&quot; to cross-reference it in two ways.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The ticket info sidebar panel showing the assignee picker, priority selector, category field, and tags input]
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-lg font-semibold text-foreground">Next steps</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/docs/replying-to-tickets", label: "Reply to a ticket",   desc: "Rich text, attachments, internal notes, and canned responses." },
            { href: "/docs/ai-features",         label: "Use AI on tickets",   desc: "Analyse, prioritise, and draft replies with one click." },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors group">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
              </div>
              <ArrowRight size={14} className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </section>

    </article>
  );
}
