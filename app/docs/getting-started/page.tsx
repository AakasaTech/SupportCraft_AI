import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocsBreadcrumb } from "../_components/DocsBreadcrumb";

export const metadata: Metadata = {
  title: "Getting Started — SupportCraft AI Docs",
  description: "Create your SupportCraft AI account, connect your support email address, and invite your team members — all in a few minutes.",
};

export default function GettingStartedPage() {
  return (
    <article className="prose-docs">

      <DocsBreadcrumb crumbs={[{ label: "Getting Started", href: "/docs/getting-started" }]} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground">Getting started with SupportCraft AI</h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        This guide walks you through the three steps to get your support inbox live: creating your account, setting up your email address, and inviting your team.
      </p>

      {/* ── Step 1 ── */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">1. Create your account and workspace</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Go to{" "}
          <Link href="/register" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
            supportcraft.aakasa.dev/register
          </Link>{" "}
          and sign up with your email address and a password, or click <strong>Continue with Google</strong> to use your existing Google account.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          During sign-up you&apos;ll be asked for your <strong>organisation name</strong> — this becomes your workspace. Everything in SupportCraft AI (your tickets, customers, agents, and settings) belongs to this workspace. You can change the name later from <strong>Settings → Organisation</strong>.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The person who creates the workspace is automatically the <strong>Owner</strong>. Owners have full access to all settings and can assign Admin roles to other team members.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The SupportCraft AI registration page showing the name, email, password fields and the Google sign-in button]
        </div>
      </section>

      {/* ── Step 2 ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">2. Connect your support email address</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          SupportCraft AI gives each workspace a dedicated support email address. When customers email that address, their message automatically becomes a ticket in your inbox — no forwarding rules, no SMTP configuration, no email server setup required.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To set yours up, go to <strong>Settings → Email</strong> and enter a subdomain slug. For example, if you type <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">acme</code>, your support address becomes:
        </p>
        <div className="mt-3 rounded-lg border border-border bg-muted/50 px-4 py-3 font-mono text-sm">
          acme@supportcraft.aakasa.dev
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          You can also set a <strong>Display Name</strong> (shown in your customers&apos; inbox as the sender name, e.g. &quot;Acme Support&quot;) and an optional <strong>Email Signature</strong> that appears at the bottom of every agent reply.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Once saved, share your new support address with your customers — on your website, in your app, or in your email footer. Any email sent there will arrive in SupportCraft AI within seconds.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The Settings → Email page showing the subdomain slug input, display name field, and save button]
        </div>

        <div className="mt-4 rounded-xl border border-primary/20 bg-primary-subtle/30 p-4 text-sm text-foreground">
          <strong>Tip:</strong> New tickets get an automatic acknowledgement email with the ticket number in the subject line, so your customers know their message arrived. You can customise the wording at <strong>Settings → Email → Email Templates</strong>.
        </div>
      </section>

      {/* ── Step 3 ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">3. Invite your team members</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Go to <strong>Settings → Team</strong> and click <strong>Invite</strong>. Enter the person&apos;s email address and choose a role:
        </p>

        <ul className="mt-4 space-y-2.5">
          {[
            { role: "Admin",  desc: "Full access to tickets, customers, settings, and team management. Cannot transfer ownership." },
            { role: "Agent",  desc: "Can view and reply to tickets, add internal notes, and manage customers. Cannot access billing or team settings." },
            { role: "Viewer", desc: "Read-only access to tickets and customers. Cannot reply or make changes." },
          ].map(({ role, desc }) => (
            <li key={role} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="mt-0.5 shrink-0 rounded-md bg-primary-subtle px-2 py-0.5 text-[11px] font-semibold text-primary">{role}</span>
              <span>{desc}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The invited person receives an email with a secure link. When they click it and create their account, they&apos;re automatically added to your workspace with the role you selected.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Pending invitations are listed on the Team page until accepted. You can cancel an invitation before it&apos;s used.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The Settings → Team page showing the invite form with email input and role dropdown, plus the list of current team members]
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-lg font-semibold text-foreground">What&apos;s next?</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/docs/tickets",             label: "Learn how tickets work",      desc: "Understand the ticket lifecycle from first email to resolution." },
            { href: "/docs/replying-to-tickets", label: "Reply to your first ticket",  desc: "Rich text editor, attachments, internal notes, and canned responses." },
          ].map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors group"
            >
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
