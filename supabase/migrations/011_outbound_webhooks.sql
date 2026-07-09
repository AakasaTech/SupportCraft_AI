-- ============================================================
--  Outbound Webhooks — push ticket events to external systems
-- ============================================================

CREATE TABLE IF NOT EXISTS outbound_webhooks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by    uuid                 REFERENCES profiles(id)       ON DELETE SET NULL,
  name          text        NOT NULL,
  url           text        NOT NULL,
  secret        text        NOT NULL,   -- HMAC-SHA256 signing secret
  events        text[]      NOT NULL DEFAULT '{}',
  enabled       boolean     NOT NULL DEFAULT true,
  last_fired_at timestamptz,
  last_status   integer,               -- HTTP status of last delivery
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outbound_webhooks_org_idx ON outbound_webhooks (org_id);

ALTER TABLE outbound_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhooks: org members can view"
  ON outbound_webhooks FOR SELECT
  USING (org_id = get_user_org_id());

CREATE POLICY "webhooks: owners and admins can insert"
  ON outbound_webhooks FOR INSERT
  WITH CHECK (
    org_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "webhooks: owners and admins can update"
  ON outbound_webhooks FOR UPDATE
  USING (
    org_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "webhooks: owners and admins can delete"
  ON outbound_webhooks FOR DELETE
  USING (
    org_id = get_user_org_id()
    AND get_user_role() IN ('owner', 'admin')
  );
