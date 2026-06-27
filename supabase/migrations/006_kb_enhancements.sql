-- Phase 9: AI-Powered Knowledge Base enhancements

-- ── Extend article_status enum ────────────────────────────────────────────────
-- Postgres requires adding enum values with ALTER TYPE
ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'archived';

-- ── Extend knowledge_articles ─────────────────────────────────────────────────
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS slug               text,
  ADD COLUMN IF NOT EXISTS excerpt            text,
  ADD COLUMN IF NOT EXISTS cover_image_url    text,
  ADD COLUMN IF NOT EXISTS visibility         text NOT NULL DEFAULT 'public'
                                              CHECK (visibility IN ('public','internal','private')),
  ADD COLUMN IF NOT EXISTS seo_title          text,
  ADD COLUMN IF NOT EXISTS seo_description    text,
  ADD COLUMN IF NOT EXISTS reading_time_min   int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS version            int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS views_count        int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS helpful_votes      int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful_votes  int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category_id        uuid,
  ADD COLUMN IF NOT EXISTS published_at       timestamptz;

-- Unique slug per org
CREATE UNIQUE INDEX IF NOT EXISTS knowledge_articles_org_slug_uidx
  ON knowledge_articles(org_id, slug) WHERE slug IS NOT NULL;

-- FTS index
ALTER TABLE knowledge_articles
  ADD COLUMN IF NOT EXISTS fts tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(content,''))
  ) STORED;

CREATE INDEX IF NOT EXISTS knowledge_articles_fts_idx
  ON knowledge_articles USING GIN (fts);

-- ── KB Categories ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kb_categories (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name        text NOT NULL,
  slug        text NOT NULL,
  description text,
  icon        text,
  sort_order  int  NOT NULL DEFAULT 0,
  parent_id   uuid REFERENCES kb_categories(id) ON DELETE SET NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS kb_categories_org_slug_uidx ON kb_categories(org_id, slug);
CREATE INDEX IF NOT EXISTS kb_categories_org_id_idx ON kb_categories(org_id);

-- Foreign key from articles to categories
ALTER TABLE knowledge_articles
  ADD CONSTRAINT fk_article_category
  FOREIGN KEY (category_id) REFERENCES kb_categories(id) ON DELETE SET NULL
  NOT VALID;

-- ── Article Versions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_versions (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id     uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  version_number int  NOT NULL,
  title          text NOT NULL,
  content        text NOT NULL,
  change_summary text,
  author_id      uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_versions_article_idx ON article_versions(article_id, version_number DESC);
CREATE UNIQUE INDEX IF NOT EXISTS article_versions_uidx ON article_versions(article_id, version_number);

-- ── Article Feedback ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_feedback (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id  uuid NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  is_helpful  boolean NOT NULL,
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_feedback_article_idx ON article_feedback(article_id);

-- ── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE kb_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_feedback ENABLE ROW LEVEL SECURITY;

-- kb_categories: org members only
CREATE POLICY "kb_categories_org_select" ON kb_categories FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "kb_categories_org_insert" ON kb_categories FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "kb_categories_org_update" ON kb_categories FOR UPDATE
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "kb_categories_org_delete" ON kb_categories FOR DELETE
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- article_versions: org members via article
CREATE POLICY "article_versions_org_select" ON article_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM knowledge_articles a
    WHERE a.id = article_versions.article_id
      AND a.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));
CREATE POLICY "article_versions_org_insert" ON article_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM knowledge_articles a
    WHERE a.id = article_versions.article_id
      AND a.org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
  ));

-- article_feedback: any authenticated user can insert (portal customers etc.)
CREATE POLICY "article_feedback_select" ON article_feedback FOR SELECT
  USING (true);
CREATE POLICY "article_feedback_insert" ON article_feedback FOR INSERT
  WITH CHECK (true);

-- Updated_at trigger for kb_categories
CREATE TRIGGER kb_categories_updated_at
  BEFORE UPDATE ON kb_categories
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
