-- Phase 10: Email System & Omnichannel Communication

-- ─────────────────────────────────────────────
-- Per-organization email settings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_settings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  support_email         text,
  tenant_slug           text UNIQUE, -- e.g. "acme" → acme@supportcraft.aakasa.dev
  display_name          text,
  reply_to              text,
  outbound_provider     text NOT NULL DEFAULT 'smtp' CHECK (outbound_provider IN ('ses','smtp','sendgrid','mailgun','postmark')),
  provider_config       jsonb DEFAULT '{}',
  signature_html        text,
  footer_html           text,
  auto_reply_enabled    boolean NOT NULL DEFAULT false,
  auto_reply_config     jsonb DEFAULT '{}',
  bounce_handling       boolean NOT NULL DEFAULT true,
  tracking_enabled      boolean NOT NULL DEFAULT false,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Raw inbound audit log (append-only)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_raw_inbound (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid REFERENCES organizations(id) ON DELETE SET NULL,
  received_at         timestamptz NOT NULL DEFAULT now(),
  from_address        text NOT NULL,
  to_address          text NOT NULL,
  message_id          text UNIQUE,
  subject             text,
  payload             jsonb NOT NULL DEFAULT '{}',
  processing_status   text NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending','processing','processed','failed','spam')),
  error_message       text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Processed email messages (linked to tickets)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_messages (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ticket_id             uuid REFERENCES tickets(id) ON DELETE SET NULL,
  direction             text NOT NULL CHECK (direction IN ('inbound','outbound')),
  message_id            text UNIQUE,
  in_reply_to           text,
  "references"          text[] DEFAULT '{}',
  from_address          text NOT NULL,
  to_address            text NOT NULL,
  cc_addresses          text[] DEFAULT '{}',
  reply_to              text,
  subject               text NOT NULL DEFAULT '',
  body_plain            text,
  body_html             text,
  sanitized_body_html   text,
  provider              text,
  provider_message_id   text,
  status                text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','queued','sent','delivered','failed','bounced','rejected','spam')),
  raw_inbound_id        uuid REFERENCES email_raw_inbound(id) ON DELETE SET NULL,
  sent_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Delivery tracking events
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_delivery_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_message_id    uuid NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
  event_type          text NOT NULL CHECK (event_type IN ('queued','sent','delivered','opened','clicked','bounced','rejected','complained','deferred')),
  occurred_at         timestamptz NOT NULL DEFAULT now(),
  provider_data       jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Attachments (stored in Supabase Storage)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_attachments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email_message_id    uuid REFERENCES email_messages(id) ON DELETE CASCADE,
  ticket_id           uuid REFERENCES tickets(id) ON DELETE SET NULL,
  filename            text NOT NULL,
  content_type        text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes          int NOT NULL DEFAULT 0,
  storage_path        text NOT NULL,
  is_inline           boolean NOT NULL DEFAULT false,
  content_id          text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- Outbound email queue
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_queue (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  to_addresses        text[] NOT NULL,
  cc_addresses        text[] DEFAULT '{}',
  from_address        text,
  reply_to            text,
  subject             text NOT NULL,
  body_html           text,
  body_plain          text,
  template_slug       text,
  template_vars       jsonb DEFAULT '{}',
  priority            int NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed','dead')),
  retry_count         int NOT NULL DEFAULT 0,
  max_retries         int NOT NULL DEFAULT 3,
  next_retry_at       timestamptz,
  scheduled_at        timestamptz,
  ticket_id           uuid REFERENCES tickets(id) ON DELETE SET NULL,
  email_message_id    uuid REFERENCES email_messages(id) ON DELETE SET NULL,
  metadata            jsonb DEFAULT '{}',
  error_message       text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  processed_at        timestamptz
);

-- ─────────────────────────────────────────────
-- Email templates (system + per-org overrides)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid REFERENCES organizations(id) ON DELETE CASCADE,
  slug                text NOT NULL,
  name                text NOT NULL,
  subject             text NOT NULL,
  body_html           text NOT NULL,
  body_plain          text,
  variables           jsonb DEFAULT '[]',
  is_system           boolean NOT NULL DEFAULT false,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

-- ─────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_email_messages_org      ON email_messages(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_messages_ticket   ON email_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_msgid    ON email_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_email_messages_status   ON email_messages(status);
CREATE INDEX IF NOT EXISTS idx_email_delivery_msg      ON email_delivery_events(email_message_id);
CREATE INDEX IF NOT EXISTS idx_email_delivery_type     ON email_delivery_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_attachments_msg   ON email_attachments(email_message_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_org_status  ON email_queue(org_id, status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_next_retry  ON email_queue(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_raw_inbound_org   ON email_raw_inbound(org_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_raw_msgid         ON email_raw_inbound(message_id);

-- ─────────────────────────────────────────────
-- RLS Policies
-- ─────────────────────────────────────────────
ALTER TABLE email_settings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_raw_inbound       ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_messages          ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_delivery_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_attachments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue             ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates         ENABLE ROW LEVEL SECURITY;

-- Helper
CREATE OR REPLACE FUNCTION current_org_id() RETURNS uuid AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- email_settings
DROP POLICY IF EXISTS email_settings_select ON email_settings;
DROP POLICY IF EXISTS email_settings_update ON email_settings;
DROP POLICY IF EXISTS email_settings_insert ON email_settings;
CREATE POLICY email_settings_select ON email_settings FOR SELECT USING (org_id = current_org_id());
CREATE POLICY email_settings_update ON email_settings FOR UPDATE USING (org_id = current_org_id());
CREATE POLICY email_settings_insert ON email_settings FOR INSERT WITH CHECK (org_id = current_org_id());

-- email_messages
DROP POLICY IF EXISTS email_messages_select ON email_messages;
DROP POLICY IF EXISTS email_messages_insert ON email_messages;
DROP POLICY IF EXISTS email_messages_update ON email_messages;
CREATE POLICY email_messages_select ON email_messages FOR SELECT USING (org_id = current_org_id());
CREATE POLICY email_messages_insert ON email_messages FOR INSERT WITH CHECK (org_id = current_org_id());
CREATE POLICY email_messages_update ON email_messages FOR UPDATE USING (org_id = current_org_id());

-- email_delivery_events (via message ownership)
DROP POLICY IF EXISTS email_delivery_select ON email_delivery_events;
CREATE POLICY email_delivery_select ON email_delivery_events FOR SELECT
  USING (email_message_id IN (SELECT id FROM email_messages WHERE org_id = current_org_id()));

-- email_attachments
DROP POLICY IF EXISTS email_attachments_select ON email_attachments;
DROP POLICY IF EXISTS email_attachments_insert ON email_attachments;
CREATE POLICY email_attachments_select ON email_attachments FOR SELECT USING (org_id = current_org_id());
CREATE POLICY email_attachments_insert ON email_attachments FOR INSERT WITH CHECK (org_id = current_org_id());

-- email_queue
DROP POLICY IF EXISTS email_queue_select ON email_queue;
DROP POLICY IF EXISTS email_queue_insert ON email_queue;
CREATE POLICY email_queue_select ON email_queue FOR SELECT USING (org_id = current_org_id());
CREATE POLICY email_queue_insert ON email_queue FOR INSERT WITH CHECK (org_id = current_org_id());

-- email_templates (system templates visible to all; org templates scoped)
DROP POLICY IF EXISTS email_templates_select ON email_templates;
DROP POLICY IF EXISTS email_templates_insert ON email_templates;
DROP POLICY IF EXISTS email_templates_update ON email_templates;
CREATE POLICY email_templates_select ON email_templates FOR SELECT
  USING (is_system = true OR org_id = current_org_id());
CREATE POLICY email_templates_insert ON email_templates FOR INSERT
  WITH CHECK (is_system = false AND org_id = current_org_id());
CREATE POLICY email_templates_update ON email_templates FOR UPDATE
  USING (is_system = false AND org_id = current_org_id());

-- email_raw_inbound (service role only via admin client; agents can read for audit)
DROP POLICY IF EXISTS email_raw_select ON email_raw_inbound;
CREATE POLICY email_raw_select ON email_raw_inbound FOR SELECT USING (org_id = current_org_id());

-- ─────────────────────────────────────────────
-- Add email_channel column to tickets
-- ─────────────────────────────────────────────
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS channel text DEFAULT 'web' CHECK (channel IN ('web','email','chat','whatsapp','sms','slack','teams'));
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS source_email_message_id uuid REFERENCES email_messages(id) ON DELETE SET NULL;

-- Add bounce status to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'active' CHECK (email_status IN ('active','bounced','unsubscribed','complained'));
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email_bounced_at timestamptz;
