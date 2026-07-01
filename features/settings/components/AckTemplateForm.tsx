"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { saveAckTemplate, type AckTemplate } from "../actions/emailTemplates";

const DEFAULT_SUBJECT = "[Ticket #{{ticket_number}}] {{ticket_subject}}";
const DEFAULT_BODY = `Hi {{customer_name}},

Thank you for contacting {{organization_name}} Support. We've received your request and created a ticket.

Ticket reference: [Ticket #{{ticket_number}}]
Subject: {{ticket_subject}}

Our team will get back to you shortly. You can reply to this email to add more information to your ticket.

Please keep the ticket reference in the subject line when replying.

— {{organization_name}} Support Team`;

const VARIABLES = [
  { key: "{{customer_name}}",     label: "Customer name" },
  { key: "{{ticket_number}}",     label: "Ticket #" },
  { key: "{{ticket_subject}}",    label: "Original subject" },
  { key: "{{organization_name}}", label: "Org name" },
  { key: "{{support_email}}",     label: "Support email" },
];

interface Props {
  initial: AckTemplate | null;
}

export function AckTemplateForm({ initial }: Props) {
  const [subject,  setSubject]  = useState(initial?.subject   ?? DEFAULT_SUBJECT);
  const [body,     setBody]     = useState(initial?.bodyPlain ?? DEFAULT_BODY);
  const [enabled,  setEnabled]  = useState(initial?.isActive  ?? true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  function insertVariable(v: string) {
    setBody(prev => prev + v);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    const result = await saveAckTemplate({ subject, bodyPlain: body, isActive: enabled });
    setSaving(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  return (
    <div className="sc-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Ticket Acknowledgement</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Sent automatically when a customer emails in and a new ticket is created.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</span>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Subject</Label>
        <Input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder={DEFAULT_SUBJECT}
          className="text-sm font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Body</Label>
          <div className="flex flex-wrap gap-1">
            {VARIABLES.map(v => (
              <button
                key={v.key}
                type="button"
                onClick={() => insertVariable(v.key)}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-mono"
              >
                {v.key}
              </button>
            ))}
          </div>
        </div>
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={12}
          className="text-sm font-mono resize-y"
          placeholder={DEFAULT_BODY}
        />
        <p className="text-xs text-muted-foreground">
          Plain text. Click a variable above to insert it. Two blank lines = paragraph break.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving…" : saved ? "Saved!" : "Save template"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setSubject(DEFAULT_SUBJECT); setBody(DEFAULT_BODY); }}
        >
          Reset to default
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
