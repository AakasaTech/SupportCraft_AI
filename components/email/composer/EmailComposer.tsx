"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Loader2, X, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Props {
  ticketId:          string;
  toAddress:         string;
  replyToMessageId?: string;
  references?:       string[];
  defaultSubject?:   string;
  onSent?:           (emailMessageId: string) => void;
}

const SIGNATURE_TONES = ["Professional", "Friendly", "Formal", "Concise"] as const;

export function EmailComposer({
  ticketId, toAddress, replyToMessageId, references = [],
  defaultSubject = "", onSent,
}: Props) {
  const [subject,  setSubject]  = useState(defaultSubject);
  const [body,     setBody]     = useState("");
  const [sending,  setSending]  = useState(false);
  const [queued,   setQueued]   = useState(false);
  const [showOpts, setShowOpts] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function send() {
    if (!body.trim()) { toast.error("Reply body cannot be empty"); return; }
    setSending(true);
    try {
      const res = await fetch("/api/email/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to:                toAddress,
          subject:           subject || `Re: Ticket #${ticketId.slice(0, 8)}`,
          html:              `<p>${body.replace(/\n/g, "<br/>")}</p>`,
          text:              body,
          ticketId,
          replyToMessageId,
          references,
          queued,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");

      toast.success(queued ? "Email queued" : "Email sent");
      setBody("");
      onSent?.(data.emailMessageId);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="sc-card">
      <div className="px-4 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground w-10 shrink-0">To</span>
          <span className="text-foreground font-medium">{toAddress}</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-2">
          <span className="text-muted-foreground w-10 shrink-0">Sub</span>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Subject"
          />
        </div>
      </div>

      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your reply…"
        rows={6}
        className="w-full px-4 py-3 bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm"
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-border gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Attach file"
          >
            <Paperclip size={16} />
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" />

          <button
            type="button"
            onClick={() => setShowOpts(p => !p)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Options"
          >
            <ChevronDown size={16} className={showOpts ? "rotate-180" : ""} />
          </button>
        </div>

        {showOpts && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={queued}
              onChange={e => setQueued(e.target.checked)}
              className="rounded"
            />
            Queue (don&apos;t send immediately)
          </label>
        )}

        <button
          type="button"
          onClick={send}
          disabled={sending || !body.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {queued ? "Queue" : "Send"}
        </button>
      </div>
    </div>
  );
}
