-- =============================================================
-- Migration 004: Storage RLS — venue-images bucket
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Create the bucket (idempotent via PL/pgSQL)
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'venue-images',
    'venue-images',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']::text[];
END $$;

-- 2. Drop existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "public_read" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "owner_update" ON storage.objects;
DROP POLICY IF EXISTS "owner_delete" ON storage.objects;

-- 3. Public read — anyone can view images
CREATE POLICY "public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'venue-images');

-- 4. Authenticated upload — only images up to 5 MB, to user-owned folder
CREATE POLICY "authenticated_upload" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'venue-images'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND lower(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp', 'gif')
    AND (COALESCE(metadata->>'size', '0')::int) <= 5242880
  );

-- 5. Owner update — only the uploader can overwrite
CREATE POLICY "owner_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'venue-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'venue-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND lower(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp', 'gif')
    AND (COALESCE(metadata->>'size', '0')::int) <= 5242880
  );

-- 6. Owner delete — only the uploader can remove
CREATE POLICY "owner_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'venue-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
