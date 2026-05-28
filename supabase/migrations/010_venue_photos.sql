-- =============================================================
-- Migration 010: Venue photos (user-uploaded game-day photos)
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Create venue_photos table
CREATE TABLE IF NOT EXISTS venue_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_photos_venue ON venue_photos(venue_id);

-- 2. Enable RLS
ALTER TABLE venue_photos ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies
DROP POLICY IF EXISTS "anyone_can_read_photos" ON venue_photos;
CREATE POLICY "anyone_can_read_photos" ON venue_photos
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authenticated_can_insert_photos" ON venue_photos;
CREATE POLICY "authenticated_can_insert_photos" ON venue_photos
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "owner_can_delete_photo" ON venue_photos;
CREATE POLICY "owner_can_delete_photo" ON venue_photos
  FOR DELETE
  USING (user_id = auth.uid());

-- 4. Admin can delete any photo
DROP POLICY IF EXISTS "admin_can_delete_any_photo" ON venue_photos;
CREATE POLICY "admin_can_delete_any_photo" ON venue_photos
  FOR DELETE
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );
