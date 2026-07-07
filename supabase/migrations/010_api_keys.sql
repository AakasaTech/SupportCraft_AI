-- ============================================================
--  API Keys — External integrations (TaskCraft AI, etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      uuid             REFERENCES profiles(id)   ON DELETE SET NULL,
  name            text NOT NULL,
  key_prefix      text NOT NULL,        -- first 16 chars for display, e.g. "sc_live_AbCd1234"
  key_hash        text NOT NULL UNIQUE, -- SHA-256 of the full key
  last_used_at    timestamptz,
  expires_at      timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_keys_org_idx  ON api_keys (organization_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys (key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's keys
CREATE POLICY "api_keys: org members can view"
  ON api_keys FOR SELECT
  USING (organization_id = get_user_org_id());

-- Only owners and admins can create keys
CREATE POLICY "api_keys: owners and admins can insert"
  ON api_keys FOR INSERT
  WITH CHECK (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

-- Only owners and admins can update (revoke) keys
CREATE POLICY "api_keys: owners and admins can update"
  ON api_keys FOR UPDATE
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );
