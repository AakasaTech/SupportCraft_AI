import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { DocsBreadcrumb } from "../_components/DocsBreadcrumb";

export const metadata: Metadata = {
  title: "AI Features — SupportCraft AI Docs",
  description: "How to use AI reply drafts, reply improvement, ticket summarisation, ticket analysis, and auto-categorisation in SupportCraft AI.",
};

const planBadge = (plan: string) => {
  const colors: Record<string, string> = {
    "All plans":   "bg-muted text-muted-foreground",
    "Startup+":    "bg-primary-subtle text-primary",
    "Business+":   "bg-ai-subtle text-ai",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colors[plan] ?? "bg-muted text-muted-foreground"}`}>
      {plan}
    </span>
  );
};

export default function AiFeaturesPage() {
  return (
    <article>

      <DocsBreadcrumb crumbs={[{ label: "AI Features", href: "/docs/ai-features" }]} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground">AI features</h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        SupportCraft AI uses OpenAI GPT-4o to help your team work faster. AI features are gated by plan — the table below shows what&apos;s available on each tier.
      </p>

      {/* Feature overview table */}
      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-semibold text-foreground">Feature</th>
              <th className="px-4 py-3 font-semibold text-foreground">Available on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[
              { feature: "AI Reply Draft",          plan: "All plans"  },
              { feature: "Reply Improvement",       plan: "Startup+"   },
              { feature: "Ticket Summarisation",    plan: "Startup+"   },
              { feature: "Auto-Categorisation",     plan: "Startup+"   },
              { feature: "Ticket Analysis",         plan: "Business+"  },
              { feature: "AI Suggested Responses",  plan: "Business+"  },
            ].map(({ feature, plan }) => (
              <tr key={feature} className="bg-card">
                <td className="px-4 py-3 text-foreground">{feature}</td>
                <td className="px-4 py-3">{planBadge(plan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        All plans have a monthly AI call quota. View your usage at <Link href="/ai" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">AI Platform</Link> in the main menu. Upgrade at{" "}
        <Link href="/#pricing" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">Pricing</Link>.
      </p>

      {/* ── Feature 1: Reply Draft ── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-foreground">AI Reply Draft</h2>
          {planBadge("All plans")}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The most-used AI feature in SupportCraft AI. Open any ticket and look at the right-hand panel — you&apos;ll see the <strong>AI Assistant</strong> section with an <strong>AI Generate</strong> button.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Click it to generate a full draft reply. Before generating, you can choose a <strong>tone</strong>:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {["Professional — clear, neutral, business-appropriate (default)",
            "Friendly — warm and conversational",
            "Empathetic — acknowledges frustration before solving",
            "Concise — short and to the point",
            "Formal — formal language and structure",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The AI reads the entire ticket — the customer&apos;s original message, any previous replies in the thread, and any matching articles in your knowledge base — to write a contextual, accurate response. Click <strong>Use</strong> to insert it into the editor, then review, edit if needed, and send.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The AI assistant panel showing the &quot;AI Generate&quot; button, the tone selector dropdown set to &quot;Professional&quot;, and a generated draft reply with a &quot;Use&quot; button]
        </div>
      </section>

      {/* ── Feature 2: Improve ── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-foreground">Reply Improvement</h2>
          {planBadge("Startup+")}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Already have a draft but want to polish it? The <strong>Improve</strong> tab in the AI assistant panel lets you refine existing text. Type or paste your draft into the reply editor, then open the Improve tab and choose an action:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {[
            "Improve — general quality improvements: clarity, grammar, flow",
            "Shorten — trim to the essentials without losing meaning",
            "Expand — add helpful detail to a brief draft",
            "Formalize — raise the language register for enterprise customers",
            "Simplify — plain language, shorter sentences, no jargon",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The AI assistant panel on the &quot;Improve&quot; tab, showing the action buttons (Improve, Shorten, Expand, Formalize, Simplify) and an improved result below]
        </div>
      </section>

      {/* ── Feature 3: Summarise ── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-foreground">Ticket Summarisation</h2>
          {planBadge("Startup+")}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Long ticket threads are hard to scan. Click <strong>Summarize</strong> in the AI assistant panel to get a concise overview of the whole conversation. The summary includes:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {[
            "A short summary of what the customer needs and what has been discussed",
            "2–4 key points from the thread",
            "A suggested next action for the agent",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          This is especially useful when picking up a ticket someone else started, or returning to a ticket after some time away.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The AI summary panel showing a 2-sentence summary, a bulleted key-points list, and a suggested next action]
        </div>
      </section>

      {/* ── Feature 4: Auto-categorise ── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-foreground">Auto-Categorisation</h2>
          {planBadge("Startup+")}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          When a new ticket arrives, SupportCraft AI can automatically read the subject and first message and suggest a <strong>category</strong> for it. This keeps your ticket list organised without agents having to manually categorise every inbound request.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Agents can always override the auto-assigned category from the ticket info panel.
        </p>
      </section>

      {/* ── Feature 5: Ticket Analysis ── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-foreground">Ticket Analysis</h2>
          {planBadge("Business+")}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The <strong>Analyze</strong> panel (in the right-hand sidebar of any ticket) lets you run a full AI analysis of the ticket with one click. The result includes:
        </p>
        <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
          {[
            "Suggested priority (Low / Medium / High / Urgent) with a confidence score",
            "Suggested category",
            "Suggested tags",
            "Customer sentiment — whether the customer sounds positive, neutral, frustrated, or satisfied",
          ].map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          Click <strong>Apply all</strong> to apply the suggested priority, category, and tags to the ticket in one action. Or review and apply individual suggestions.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The AI Analyze panel showing &quot;Priority: High&quot;, a suggested category, tags, a sentiment badge (&quot;Frustrated&quot;), and the &quot;Apply all&quot; button]
        </div>
      </section>

      {/* ── Feature 6: Suggested Responses ── */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xl font-semibold text-foreground">AI Suggested Responses</h2>
          {planBadge("Business+")}
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Available on Business and Agency plans, AI Suggested Responses provides quick-pick reply options for common ticket patterns. Unlike the full Reply Draft, suggested responses are short, targeted snippets — useful when a ticket only needs a brief acknowledgement or a standard answer.
        </p>
      </section>

      {/* ── AI Platform usage ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">Monitoring your AI usage</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Go to <Link href="/ai" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">AI Platform</Link> in the main sidebar to see how many AI calls your workspace has made this month, broken down by feature. Each plan has a monthly call quota. If you reach your limit, AI features pause until the next billing cycle — or you can upgrade your plan.
        </p>
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary-subtle/30 p-4 text-sm text-foreground">
          <strong>Tip:</strong> AI calls are counted per workspace, not per agent. One call by any agent counts toward your monthly total.
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The AI Platform page showing the monthly call counter, usage bar, and a breakdown table by feature (Reply, Improve, Summarize, etc.)]
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="mt-14 border-t border-border pt-10">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Want more AI features?</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Ticket Analysis, Suggested Responses, and higher monthly quotas are available on Business and Agency plans.
        </p>
        <Link
          href="/#pricing"
          className="inline-flex items-center gap-2 sc-btn-primary rounded-xl px-5 py-2.5 text-sm font-semibold"
        >
          View pricing <ArrowRight size={14} />
        </Link>
      </section>

    </article>
  );
}
