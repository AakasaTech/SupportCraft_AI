-- ============================================================
-- Give every "updated_at" column a DB-level DEFAULT now(), in addition
-- to Prisma's client-side @updatedAt behavior. Without this, any INSERT
-- that doesn't go through Prisma Client (raw SQL, our own triggers,
-- ad-hoc scripts) fails NOT NULL on updated_at.
--
-- Written by hand and scoped to ONLY these ALTER COLUMN ... SET DEFAULT
-- statements — deliberately not touching "knowledge_articles.fts" or the
-- hand-written GIN indexes from the previous migration, since Prisma's
-- auto-generated diff for this same change tries to (incorrectly) drop
-- those raw-SQL-managed objects because it doesn't know about the
-- GENERATED ALWAYS AS column or the unmanaged indexes.
-- ============================================================

ALTER TABLE organizations       ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE profiles            ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE customers           ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE tickets             ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE ticket_templates    ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE knowledge_articles  ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE kb_categories       ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE subscriptions       ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE announcements       ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE email_settings      ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE email_templates     ALTER COLUMN updated_at SET DEFAULT now();
ALTER TABLE outbound_webhooks   ALTER COLUMN updated_at SET DEFAULT now();
