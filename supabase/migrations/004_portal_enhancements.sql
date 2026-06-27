-- ============================================================
-- Migration 004: Portal Enhancements
-- Adds: announcements, ticket_ratings (CSAT)
-- ============================================================

-- ─── Announcements ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS announcements (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid         NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title        text         NOT NULL,
  content      text         NOT NULL,
  type         text         NOT NULL DEFAULT 'info'
                            CHECK (type IN ('info', 'warning', 'maintenance', 'feature')),
  is_pinned    boolean      NOT NULL DEFAULT false,
  published_at timestamptz  DEFAULT now(),
  created_by   uuid         REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   timestamptz  NOT NULL DEFAULT now(),
  updated_at   timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_select_announcements" ON announcements;
CREATE POLICY "agents_select_announcements" ON announcements
  FOR SELECT USING (org_id = get_user_org_id());

DROP POLICY IF EXISTS "admins_manage_announcements" ON announcements;
CREATE POLICY "admins_manage_announcements" ON announcements
  FOR ALL USING (
    org_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_announcements_updated_at();

-- ─── Ticket ratings (CSAT) ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_ratings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   uuid        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  customer_id uuid        REFERENCES customers(id) ON DELETE SET NULL,
  rating      integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id)
);

ALTER TABLE ticket_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agents_select_ratings" ON ticket_ratings;
CREATE POLICY "agents_select_ratings" ON ticket_ratings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets t WHERE t.id = ticket_id AND t.org_id = get_user_org_id()
    )
  );

DROP POLICY IF EXISTS "customers_insert_rating" ON ticket_ratings;
CREATE POLICY "customers_insert_rating" ON ticket_ratings
  FOR INSERT WITH CHECK (true); -- enforced in app via admin client + ownership check
