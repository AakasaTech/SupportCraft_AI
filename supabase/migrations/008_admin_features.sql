-- Admin features: free pass on organizations, is_active on profiles

-- Free pass columns on organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS freepass_plan TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS freepass_until TIMESTAMPTZ DEFAULT NULL;

-- is_active column on profiles (soft-suspend users)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Index for quick freepass expiry queries
CREATE INDEX IF NOT EXISTS idx_organizations_freepass_until ON organizations (freepass_until)
  WHERE freepass_plan IS NOT NULL;
