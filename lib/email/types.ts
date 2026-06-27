// ─── Provider abstraction ────────────────────────────────────────────────────

export type OutboundProvider = "ses" | "smtp" | "sendgrid" | "mailgun" | "postmark";

export interface EmailAddress {
  address: string;
  name?: string;
}

export interface OutboundEmailMessage {
  from:     EmailAddress;
  to:       EmailAddress[];
  cc?:      EmailAddress[];
  bcc?:     EmailAddress[];
  replyTo?: string;
  subject:  string;
  html?:    string;
  text?:    string;
  attachments?: OutboundAttachment[];
  headers?: Record<string, string>;
  /** Threading headers for ticket continuity */
  inReplyTo?: string;
  references?: string[];
}

export interface OutboundAttachment {
  filename:    string;
  contentType: string;
  content:     string | Buffer; // base64 string or Buffer
  contentId?:  string;
  inline?:     boolean;
}

export interface SendResult {
  success:          boolean;
  messageId?:       string;
  providerResponse?: unknown;
  error?:           string;
}

export interface ProviderConfig {
  // SES
  sesRegion?:          string;
  sesAccessKeyId?:     string;
  sesSecretAccessKey?: string;
  // SMTP / SES-SMTP
  smtpHost?:    string;
  smtpPort?:    number;
  smtpSecure?:  boolean;
  smtpUser?:    string;
  smtpPass?:    string;
  // SendGrid
  sendgridApiKey?: string;
  // Mailgun
  mailgunApiKey?:  string;
  mailgunDomain?:  string;
  // Postmark
  postmarkToken?:  string;
}

// ─── Inbound email payload (from Cloudflare Worker) ─────────────────────────

export interface InboundEmailPayload {
  tenant_id:    string;
  to_address:   string;
  from_address: string;
  from_name:    string | null;
  reply_to:     string | null;
  message_id:   string;
  in_reply_to:  string | null;
  references:   string[];
  subject:      string;
  body_plain:   string | null;
  body_html:    string | null;
  received_at:  string; // ISO 8601
  attachments: {
    filename:     string;
    content_type: string;
    size:         number;
    content_id:   string | null;
    content:      string; // base64
  }[];
  headers:      Record<string, string>;
  spam_signals: {
    auto_submitted:   boolean;
    has_x_loop:       boolean;
    is_bounce:        boolean;
    list_unsubscribe: boolean;
  };
}

// ─── Processing pipeline ─────────────────────────────────────────────────────

export interface ProcessedEmail {
  messageId:         string;
  fromAddress:       string;
  fromName:          string | null;
  toAddress:         string;
  replyTo:           string | null;
  subject:           string;
  bodyPlain:         string | null;
  bodyHtml:          string | null;
  sanitizedBodyHtml: string | null;
  references:        string[];
  inReplyTo:         string | null;
  receivedAt:        string;
  attachments:       ProcessedAttachment[];
  isSpam:            boolean;
  spamScore:         number;
  language?:         string;
}

export interface ProcessedAttachment {
  filename:    string;
  contentType: string;
  size:        number;
  contentId:   string | null;
  content:     string; // base64
  storagePath?: string;
}

export interface ThreadDetectionResult {
  ticketId:   string | null;
  isReply:    boolean;
  confidence: "high" | "medium" | "low";
  method?:    "message_id" | "in_reply_to" | "references" | "subject_token" | "hidden_token";
}

// ─── Email settings ───────────────────────────────────────────────────────────

export interface OrgEmailSettings {
  id:                 string;
  orgId:              string;
  supportEmail:       string | null;
  tenantSlug:         string | null;
  displayName:        string | null;
  replyTo:            string | null;
  outboundProvider:   OutboundProvider;
  providerConfig:     ProviderConfig;
  signatureHtml:      string | null;
  footerHtml:         string | null;
  autoReplyEnabled:   boolean;
  autoReplyConfig:    AutoReplyConfig;
  trackingEnabled:    boolean;
}

export interface AutoReplyConfig {
  businessHours?: AutoReplyTemplate;
  afterHours?:    AutoReplyTemplate;
  holiday?:       AutoReplyTemplate;
  firstResponse?: AutoReplyTemplate;
}

export interface AutoReplyTemplate {
  enabled:  boolean;
  subject:  string;
  body:     string;
  language: string;
}

// ─── Email analytics ──────────────────────────────────────────────────────────

export interface EmailStats {
  totalSent:         number;
  totalReceived:     number;
  totalBounced:      number;
  deliveryRate:      number;
  openRate:          number;
  replyRate:         number;
  avgFirstResponseMs: number;
}

// ─── Template variables ───────────────────────────────────────────────────────

export interface TemplateVariables {
  customer_name?:       string;
  ticket_number?:       string;
  ticket_subject?:      string;
  agent_name?:          string;
  organization_name?:   string;
  support_email?:       string;
  portal_url?:          string;
  knowledge_base_url?:  string;
  current_year?:        string;
  [key: string]: string | undefined;
}

// ─── Queue ────────────────────────────────────────────────────────────────────

export interface QueuedEmail {
  id:          string;
  orgId:       string;
  toAddresses: string[];
  ccAddresses: string[];
  fromAddress: string | null;
  replyTo:     string | null;
  subject:     string;
  bodyHtml:    string | null;
  bodyPlain:   string | null;
  templateSlug: string | null;
  templateVars: TemplateVariables;
  priority:    number;
  status:      "pending" | "processing" | "sent" | "failed" | "dead";
  retryCount:  number;
  maxRetries:  number;
  nextRetryAt: string | null;
  scheduledAt: string | null;
  ticketId:    string | null;
  metadata:    Record<string, unknown>;
  errorMessage: string | null;
  createdAt:   string;
  processedAt: string | null;
}
