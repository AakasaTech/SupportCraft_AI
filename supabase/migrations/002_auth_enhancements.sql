-- ============================================================
-- 002_auth_enhancements.sql
-- Auth & authorization enhancements for Phase 4
-- Run in Supabase SQL editor after 001_init.sql
-- ============================================================

-- 1. Add 'viewer' role to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'viewer';

-- 2. Add columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone    text    DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS language    text    DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS phone       text,
  ADD COLUMN IF NOT EXISTS job_title   text;

-- 3. Add columns to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS website       text,
  ADD COLUMN IF NOT EXISTS timezone      text    DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS country       text,
  ADD COLUMN IF NOT EXISTS support_email text,
  ADD COLUMN IF NOT EXISTS logo_url      text;

-- 4. Add auth_user_id to customers (for customer portal login)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS customers_auth_user_id_idx ON customers(auth_user_id);

-- 5. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event       text NOT NULL,
  metadata    jsonb DEFAULT '{}',
  ip_address  text,
  user_agent  text,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_org_id_idx    ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx   ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs(created_at DESC);

-- 6. RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only owners and admins can view audit logs for their org
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    org_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND org_id = audit_logs.org_id
        AND role IN ('owner', 'admin')
    )
  );

-- Service role inserts audit logs (via admin client)
CREATE POLICY "audit_logs_insert_service" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 7. Customer portal: allow customers to select their own row
DROP POLICY IF EXISTS "customers_portal_self_select" ON customers;
CREATE POLICY "customers_portal_self_select" ON customers
  FOR SELECT USING (auth_user_id = auth.uid());

-- ============================================================
-- NOTES FOR SETUP:
-- 1. Run this file in Supabase SQL Editor
-- 2. Enable Google OAuth in Supabase Dashboard:
--    Authentication → Providers → Google → Enable → add Client ID + Secret
-- 3. Add redirect URL to Supabase:
--    Authentication → URL Configuration → Redirect URLs:
--    http://localhost:3002/auth/callback
-- ============================================================
