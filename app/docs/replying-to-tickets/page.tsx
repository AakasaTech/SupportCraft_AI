import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { DocsBreadcrumb } from "../_components/DocsBreadcrumb";

export const metadata: Metadata = {
  title: "Replying to Tickets — SupportCraft AI Docs",
  description: "How to use the SupportCraft AI reply editor — rich text formatting, inline images, file attachments, internal notes, @mentions, and canned responses.",
};

export default function ReplyingPage() {
  return (
    <article>

      <DocsBreadcrumb crumbs={[{ label: "Replying to Tickets", href: "/docs/replying-to-tickets" }]} />

      <h1 className="text-3xl font-bold tracking-tight text-foreground">Replying to tickets</h1>
      <p className="mt-3 text-muted-foreground leading-relaxed">
        SupportCraft AI includes a full-featured reply editor at the bottom of every ticket. This page explains everything it can do.
      </p>

      {/* ── Section 1: Editor overview ── */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold text-foreground">The reply editor</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The editor lives at the bottom of any open ticket. It has two modes — <strong>Public Reply</strong> and <strong>Internal Note</strong> (explained below) — and a full formatting toolbar.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The toolbar gives you:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-none">
          {[
            "Text formatting — Bold, Italic, Underline, Strikethrough",
            "Headings — H1, H2, H3",
            "Lists — bulleted and numbered",
            "Blockquote and code block",
            "Hyperlinks — select text and click the link button to add a URL",
            "Inline image insertion — opens a file picker (see also: paste and drag & drop below)",
            "File attachment — opens a file picker for non-image attachments",
            "Text alignment — left, centre, right",
            "Undo and redo",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The reply editor toolbar showing all button groups — undo/redo, formatting, headings, lists, blockquote, code, link, image, attach, alignment]
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Press <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">⌘ Return</kbd> (Mac) or <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs font-mono">Ctrl Return</kbd> (Windows) to send without reaching for the mouse.
        </p>
      </section>

      {/* ── Section 2: Public vs Internal ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">Public replies vs. internal notes</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          At the top of the editor you&apos;ll see two tabs. This is one of the most important distinctions in SupportCraft AI:
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground mb-2">Public Reply</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• Sent to the customer by email</li>
              <li>• Visible in the customer portal</li>
              <li>• Appears in the ticket thread for all agents</li>
              <li>• Triggers any email notification rules</li>
            </ul>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <Lock size={13} className="text-amber-700" />
              <p className="text-sm font-semibold text-amber-800">Internal Note</p>
            </div>
            <ul className="space-y-1.5 text-sm text-amber-700">
              <li>• <strong>Never</strong> sent to the customer</li>
              <li>• <strong>Not</strong> visible in the customer portal</li>
              <li>• Only agents logged in to SupportCraft AI can see it</li>
              <li>• Shown with a yellow background in the thread</li>
            </ul>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Use internal notes to leave context for teammates (&quot;checked with billing — refund approved&quot;), flag follow-ups, or discuss a ticket without the customer seeing the conversation. A clear banner inside the editor reminds you which mode is active before you send.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The editor in Internal Note mode — showing the amber/yellow background on the editor area and the &quot;Visible to agents only&quot; banner]
        </div>
      </section>

      {/* ── Section 3: Images & attachments ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">Inline images and file attachments</h2>

        <h3 className="mt-5 text-sm font-semibold text-foreground">Inline images</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Images can be inserted directly into the body of your reply (so the customer sees them inline, not as a separate download) in three ways:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-none">
          {[
            "Paste — copy an image to your clipboard and press Ctrl/⌘ V anywhere in the editor.",
            "Drag and drop — drag an image file from your desktop onto the editor area.",
            "Toolbar — click the image button (mountain icon) to open a file picker.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted-foreground">
          A preview appears immediately while the image uploads in the background.
        </p>

        <h3 className="mt-6 text-sm font-semibold text-foreground">File attachments</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          For files that aren&apos;t images (PDFs, spreadsheets, ZIP archives, etc.), use the paperclip button in the toolbar or drag and drop the file onto the editor. Attachments appear as downloadable chips below the editor with a progress bar while uploading. The maximum file size is <strong>25 MB per file</strong>.
        </p>

        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The editor with an image pasted inline in the text, and two file attachment chips below showing their filenames and sizes]
        </div>
      </section>

      {/* ── Section 4: @mentions ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">@Mentioning teammates</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Click the <strong>@</strong> button in the editor footer to open a list of agents in your workspace. Selecting a name inserts <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">@Their Name</code> at the cursor position. This is useful in internal notes to flag a ticket for a specific colleague.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The @mention popover showing a list of agent names]
        </div>
      </section>

      {/* ── Section 5: Canned responses ── */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-foreground">Canned responses</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Canned responses are pre-written reply snippets you can insert with a single click. They&apos;re ideal for answers to common questions — like refund policy, how to reset a password, or how to escalate an issue.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Click the <strong>Canned</strong> button (speech bubble icon) in the editor footer to open the canned response picker. You can search by name or shortcut. Selecting a response inserts its full content at the cursor — you can then edit it before sending.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          To create new canned responses, go to{" "}
          <Link href="/settings/canned-responses" className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors">
            Settings → Canned Responses
          </Link>. Give each response a name, a short shortcut (e.g. <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">refund</code>), and the response body.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border bg-muted/30 px-6 py-5 text-sm text-muted-foreground">
          [SCREENSHOT: The canned responses popover showing a search box and a list of response names with their shortcuts]
        </div>
      </section>

      {/* ── Next steps ── */}
      <section className="mt-14 border-t border-border pt-10">
        <h2 className="text-lg font-semibold text-foreground">Next steps</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { href: "/docs/ai-features",    label: "Let AI draft the reply for you", desc: "One-click draft generation grounded in your knowledge base." },
            { href: "/docs/tickets",        label: "Manage ticket properties",       desc: "Assign, tag, prioritise, and change ticket status." },
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
