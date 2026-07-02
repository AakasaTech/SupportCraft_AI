-- ============================================================
-- Migration 009: Create Supabase Storage buckets
-- ============================================================

-- ticket-attachments bucket
-- public = true so getPublicUrl() works without signed URLs
-- 25 MB per-file limit matches the app-side check in /api/upload
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-attachments',
  'ticket-attachments',
  true,
  26214400,  -- 25 MB
  NULL       -- allow all MIME types
)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS policies ──────────────────────────────────────────────────────
-- Uploads go through the service-role admin client (bypasses RLS).
-- SELECT policy allows authenticated org members to read their own files
-- directly (e.g. image preview in the browser without a signed URL).

CREATE POLICY "Org members can read ticket attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'ticket-attachments'
    AND (
      SELECT org_id::text
      FROM public.profiles
      WHERE id = auth.uid()
    ) = (string_to_array(name, '/'))[1]
  );
