-- Phase 6 — Ticket Management System enhancements
-- Run OUTSIDE a transaction block (ALTER TYPE ADD VALUE requirement)

-- ─── Extend ticket_status enum ────────────────────────────────────────────────
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'new' BEFORE 'open';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'open';

-- ─── New column additions ─────────────────────────────────────────────────────

-- Organizations: ticket numbering
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS ticket_prefix  text    NOT NULL DEFAULT 'SUP',
  ADD COLUMN IF NOT EXISTS ticket_counter bigint  NOT NULL DEFAULT 1001;

-- Tickets: enhanced fields
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS ticket_number      text,
  ADD COLUMN IF NOT EXISTS department         text,
  ADD COLUMN IF NOT EXISTS source             text    NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS due_date           timestamptz,
  ADD COLUMN IF NOT EXISTS first_response_at  timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at        timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at          timestamptz,
  ADD COLUMN IF NOT EXISTS is_spam            boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_vector      tsvector;

-- Unique ticket number per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_number_org
  ON tickets (org_id, ticket_number)
  WHERE ticket_number IS NOT NULL;

-- ticket_messages: internal notes support
ALTER TABLE ticket_messages
  ADD COLUMN IF NOT EXISTS is_internal  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS edited_at    timestamptz,
  ADD COLUMN IF NOT EXISTS metadata     jsonb   NOT NULL DEFAULT '{}';

-- ─── New tables ───────────────────────────────────────────────────────────────

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  color       text NOT NULL DEFAULT '#6366f1',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_departments_org ON departments(org_id);
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_org" ON departments;
CREATE POLICY "departments_org" ON departments FOR ALL
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Ticket templates
CREATE TABLE IF NOT EXISTS ticket_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  subject     text NOT NULL,
  body        text NOT NULL,
  category    text,
  department  text,
  priority    text NOT NULL DEFAULT 'medium',
  tags        text[] NOT NULL DEFAULT '{}',
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_templates_org ON ticket_templates(org_id);
ALTER TABLE ticket_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_templates_org" ON ticket_templates;
CREATE POLICY "ticket_templates_org" ON ticket_templates FOR ALL
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Saved views (filter presets)
CREATE TABLE IF NOT EXISTS saved_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  filters    jsonb NOT NULL DEFAULT '{}',
  is_shared  boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_views_org ON saved_views(org_id);
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_views_policy" ON saved_views;
CREATE POLICY "saved_views_policy" ON saved_views FOR ALL
  USING (
    org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    AND (is_shared = true OR user_id = auth.uid())
  );

-- Ticket relations (parent/child/duplicate/related/blocks)
CREATE TABLE IF NOT EXISTS ticket_relations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  related_id    uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  created_by    uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ticket_id, related_id, relation_type)
);
ALTER TABLE ticket_relations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_relations_org" ON ticket_relations;
CREATE POLICY "ticket_relations_org" ON ticket_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      WHERE t.id = ticket_id
        AND t.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

-- Ticket attachments
CREATE TABLE IF NOT EXISTS ticket_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  message_id   uuid REFERENCES ticket_messages(id) ON DELETE SET NULL,
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_size    bigint NOT NULL,
  mime_type    text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by  uuid REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket ON ticket_attachments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_attachments_message ON ticket_attachments(message_id);
ALTER TABLE ticket_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_attachments_org" ON ticket_attachments;
CREATE POLICY "ticket_attachments_org" ON ticket_attachments FOR ALL
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ─── Ticket number generation trigger ────────────────────────────────────────

CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_prefix  text;
  v_counter bigint;
BEGIN
  SELECT COALESCE(ticket_prefix, 'SUP'), ticket_counter
  INTO v_prefix, v_counter
  FROM organizations
  WHERE id = NEW.org_id
  FOR UPDATE;

  NEW.ticket_number := v_prefix || '-' || v_counter::text;

  UPDATE organizations SET ticket_counter = ticket_counter + 1 WHERE id = NEW.org_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_number ON tickets;
CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION generate_ticket_number();

-- ─── Full-text search ─────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_ticket_fts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.ticket_number, '') || ' ' ||
    COALESCE(NEW.title,         '') || ' ' ||
    COALESCE(NEW.description,   '') || ' ' ||
    COALESCE(NEW.category,      '') || ' ' ||
    COALESCE(array_to_string(NEW.tags, ' '), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ticket_fts ON tickets;
CREATE TRIGGER trg_ticket_fts
  BEFORE INSERT OR UPDATE OF title, description, category, tags ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_fts();

-- Backfill existing rows
UPDATE tickets SET search_vector = to_tsvector('english',
  COALESCE(ticket_number, '') || ' ' ||
  COALESCE(title,         '') || ' ' ||
  COALESCE(description,   '') || ' ' ||
  COALESCE(category,      '') || ' ' ||
  COALESCE(array_to_string(tags, ' '), '')
);

CREATE INDEX IF NOT EXISTS idx_tickets_fts ON tickets USING GIN(search_vector);

-- ─── Seed default departments ─────────────────────────────────────────────────
-- (optional example data for demonstration — can be removed)
-- INSERT INTO departments (org_id, name, color) SELECT id, 'Support', '#6366f1' FROM organizations;
