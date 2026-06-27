"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Loader2, CheckCircle2, XCircle, Mail, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  tenant_slug?:       string;
  display_name?:      string;
  reply_to?:          string;
  signature_html?:    string;
  auto_reply_enabled?: boolean;
}

interface Props {
  initialSettings: Settings | null;
  initialEmail:    string | null;
}

type SlugStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function EmailSettingsForm({ initialSettings, initialEmail }: Props) {
  const [slug,         setSlug]         = useState(initialSettings?.tenant_slug ?? "");
  const [displayName,  setDisplayName]  = useState(initialSettings?.display_name ?? "");
  const [replyTo,      setReplyTo]      = useState(initialSettings?.reply_to ?? "");
  const [signature,    setSignature]    = useState(initialSettings?.signature_html ?? "");
  const [autoReply,    setAutoReply]    = useState(initialSettings?.auto_reply_enabled ?? false);
  const [saving,       setSaving]       = useState(false);
  const [slugStatus,   setSlugStatus]   = useState<SlugStatus>("idle");
  const [previewEmail, setPreviewEmail] = useState(initialEmail ?? "");
  const [copied,       setCopied]       = useState(false);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced slug availability check
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current);

    const trimmed = slug.trim().toLowerCase();

    // Skip check if unchanged from saved
    if (trimmed === (initialSettings?.tenant_slug ?? "")) {
      setSlugStatus("idle");
      setPreviewEmail(initialEmail ?? "");
      return;
    }

    if (!trimmed) { setSlugStatus("idle"); setPreviewEmail(""); return; }
    if (!/^[a-z0-9-]{2,30}$/.test(trimmed)) {
      setSlugStatus("invalid");
      setPreviewEmail("");
      return;
    }

    setSlugStatus("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/email/check-slug?slug=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSlugStatus(data.available ? "available" : "taken");
        setPreviewEmail(data.available ? (data.email ?? "") : "");
      } catch {
        setSlugStatus("idle");
      }
    }, 500);

    return () => { if (checkTimer.current) clearTimeout(checkTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function save() {
    const trimmed = slug.trim().toLowerCase();
    if (!trimmed) { toast.error("Please set a support email address"); return; }
    if (slugStatus === "taken")   { toast.error("That address is already taken"); return; }
    if (slugStatus === "invalid") { toast.error("Invalid slug format"); return; }
    if (slugStatus === "checking") { toast.error("Please wait for availability check"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/email/settings", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_slug:        trimmed,
          display_name:       displayName || undefined,
          reply_to:           replyTo    || undefined,
          signature_html:     signature  || undefined,
          auto_reply_enabled: autoReply,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs = Object.values(
          (data.error?.fieldErrors as Record<string, string[]>) ?? {}
        ).flat();
        throw new Error(msgs[0] ?? data.error ?? "Save failed");
      }
      toast.success("Settings saved");
      if (data.support_email) setPreviewEmail(data.support_email);
    } catch (err) {
      toast.error(String(err));
    } finally {
      setSaving(false);
    }
  }

  async function copyEmail() {
    if (!previewEmail) return;
    await navigator.clipboard.writeText(previewEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const slugIcon = {
    idle:      null,
    checking:  <Loader2 size={14} className="animate-spin text-muted-foreground" />,
    available: <CheckCircle2 size={14} className="text-green-500" />,
    taken:     <XCircle size={14} className="text-red-500" />,
    invalid:   <XCircle size={14} className="text-red-500" />,
  }[slugStatus];

  const slugHint = {
    idle:      "Choose an address for your support inbox",
    checking:  "Checking availability…",
    available: "Available!",
    taken:     "This address is already taken — try a different one",
    invalid:   "2–30 characters, lowercase letters, numbers and hyphens only",
  }[slugStatus];

  return (
    <div className="space-y-6">
      {/* Support email card */}
      <div className="sc-card p-6 space-y-5">
        <div>
          <h3 className="font-semibold text-foreground">Support Email Address</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Customers send emails here to open tickets. You reply from the same address.
          </p>
        </div>

        {/* Slug picker */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Your address
          </label>
          <div className="flex items-center rounded-xl border border-border overflow-hidden focus-within:ring-2 focus-within:ring-primary/40 bg-background">
            <input
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="acme"
              maxLength={30}
              className="flex-1 px-3 py-2.5 bg-transparent text-foreground placeholder:text-muted-foreground text-sm outline-none min-w-0"
            />
            <div className="flex items-center gap-2 px-3 border-l border-border bg-muted/50 shrink-0">
              {slugIcon && <span>{slugIcon}</span>}
              <span className="text-sm text-muted-foreground whitespace-nowrap">@supportcraft.aakasa.dev</span>
            </div>
          </div>
          <p className={`text-xs mt-1.5 ${slugStatus === "taken" || slugStatus === "invalid" ? "text-red-500" : slugStatus === "available" ? "text-green-600" : "text-muted-foreground"}`}>
            {slugHint}
          </p>
        </div>

        {/* Live preview */}
        {previewEmail && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <Mail size={16} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">Your support inbox</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 truncate">{previewEmail}</p>
            </div>
            <button
              type="button"
              onClick={copyEmail}
              className="shrink-0 p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
              title="Copy address"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        )}
      </div>

      {/* Display & identity */}
      <div className="sc-card p-6 space-y-4">
        <h3 className="font-semibold text-foreground">Sender Identity</h3>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Display Name</label>
          <input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Acme Support"
            maxLength={100}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground mt-1">Shown as the sender name in email clients</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Reply-To Address <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input
            type="email"
            value={replyTo}
            onChange={e => setReplyTo(e.target.value)}
            placeholder={previewEmail || "Same as support address"}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <p className="text-xs text-muted-foreground mt-1">Leave blank to use your support address</p>
        </div>
      </div>

      {/* Signature */}
      <div className="sc-card p-6 space-y-3">
        <div>
          <h3 className="font-semibold text-foreground">Email Signature</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Appended to every outbound reply</p>
        </div>
        <textarea
          value={signature}
          onChange={e => setSignature(e.target.value)}
          rows={4}
          placeholder={`<p>Best regards,<br/>${displayName || "Support Team"}</p>`}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
        />
        <p className="text-xs text-muted-foreground">HTML is supported</p>
      </div>

      {/* Auto-reply */}
      <div className="sc-card p-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={autoReply}
            onChange={e => setAutoReply(e.target.checked)}
            className="rounded mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Send auto-reply on new tickets</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customers get an instant confirmation email when they open a new ticket
            </p>
          </div>
        </label>
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving || slugStatus === "checking" || slugStatus === "taken" || slugStatus === "invalid"}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        Save settings
      </button>
    </div>
  );
}
