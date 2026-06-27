"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Paperclip, ArrowUpRight, Mail } from "lucide-react";
import { DeliveryStatusBadge } from "../shared/DeliveryStatusBadge";

interface Attachment {
  id:          string;
  filename:    string;
  contentType: string;
  sizeBytes:   number;
  storagePath: string;
}

interface EmailMessage {
  id:                 string;
  direction:          "inbound" | "outbound";
  fromAddress:        string;
  toAddress:          string;
  subject:            string;
  sanitizedBodyHtml:  string | null;
  bodyPlain:          string | null;
  status:             string;
  sentAt:             string | null;
  createdAt:          string;
  attachments?:       Attachment[];
}

interface Props {
  messages: EmailMessage[];
}

export function EmailThread({ messages }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    // Expand the last message by default
    const last = messages[messages.length - 1];
    return last ? { [last.id]: true } : {};
  });

  const toggle = (id: string) =>
    setExpanded(p => ({ ...p, [id]: !p[id] }));

  if (messages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="mx-auto mb-3 opacity-30" size={32} />
        <p className="text-sm">No email thread for this ticket.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {messages.map((msg) => {
        const isOpen = expanded[msg.id];
        const isOutbound = msg.direction === "outbound";
        const date = new Date(msg.sentAt ?? msg.createdAt).toLocaleString();

        return (
          <div key={msg.id} className="sc-card overflow-hidden">
            {/* Header row */}
            <button
              type="button"
              onClick={() => toggle(msg.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className={`w-2 h-2 rounded-full shrink-0 ${isOutbound ? "bg-indigo-500" : "bg-emerald-500"}`} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {isOutbound ? `To: ${msg.toAddress}` : `From: ${msg.fromAddress}`}
                  </span>
                  <DeliveryStatusBadge status={msg.status} />
                  {msg.attachments && msg.attachments.length > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Paperclip size={11} />
                      {msg.attachments.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-muted-foreground shrink-0" />
                      : <ChevronDown size={16} className="text-muted-foreground shrink-0" />}
            </button>

            {/* Expanded body */}
            {isOpen && (
              <div className="border-t border-border px-5 py-4">
                {msg.sanitizedBodyHtml ? (
                  <div
                    className="article-content text-sm max-h-[500px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: msg.sanitizedBodyHtml }}
                  />
                ) : (
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                    {msg.bodyPlain ?? "(no content)"}
                  </pre>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Paperclip size={12} /> Attachments
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {msg.attachments.map(att => (
                        <a
                          key={att.id}
                          href={`/api/email/attachments/${att.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-xs text-foreground transition-colors"
                        >
                          <Paperclip size={11} />
                          {att.filename}
                          <span className="text-muted-foreground">
                            ({Math.round(att.sizeBytes / 1024)}KB)
                          </span>
                          <ArrowUpRight size={11} className="text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
