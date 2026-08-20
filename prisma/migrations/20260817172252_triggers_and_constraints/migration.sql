-- ============================================================
-- Hand-written migration: raw SQL that schema.prisma cannot express
-- declaratively — ticket-number generation trigger, full-text search
-- (trigger-maintained + generated column) with GIN indexes, and two
-- CHECK/uniqueness constraints Prisma's declarative schema can't express.
-- ============================================================

-- ─── Ticket number generation ──────────────────────────────────────────────
-- Row-locks the parent organization to atomically assign PREFIX-NNNN ticket
-- numbers and increment the per-org counter. Ported verbatim from the
-- original Supabase migration (003_ticket_enhancements.sql) — this is real
-- concurrency-safety logic, not something to reimplement in application code.

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

-- ─── Ticket full-text search ────────────────────────────────────────────────

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

CREATE INDEX IF NOT EXISTS idx_tickets_fts ON tickets USING GIN(search_vector);

-- ─── Knowledge article full-text search ─────────────────────────────────────
-- Prisma's migrate diff created "fts" as a plain nullable tsvector column
-- (declarative GENERATED ALWAYS AS columns aren't expressible in schema.prisma).
-- Replace it with a real generated column here.

ALTER TABLE knowledge_articles DROP COLUMN IF EXISTS fts;
ALTER TABLE knowledge_articles
  ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_knowledge_articles_fts ON knowledge_articles USING GIN(fts);

-- ─── Invitation race-condition fix ──────────────────────────────────────────
-- Backs the check-then-insert invitation flow with a real DB constraint:
-- only one pending (unaccepted) invitation per org+email at a time.

CREATE UNIQUE INDEX IF NOT EXISTS invitations_org_email_pending_uidx
  ON invitations(org_id, email)
  WHERE accepted_at IS NULL;

-- ─── Value-range constraints (not expressible declaratively in schema.prisma) ──

ALTER TABLE ticket_ratings
  ADD CONSTRAINT ticket_ratings_rating_check CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE email_queue
  ADD CONSTRAINT email_queue_priority_check CHECK (priority BETWEEN 1 AND 10);
