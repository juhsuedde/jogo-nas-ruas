-- =============================================================
-- Migration 003: Enable RLS on venues + rate limiting
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Enable RLS on the venues table
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "public_can_read_approved" ON venues;
DROP POLICY IF EXISTS "authenticated_can_insert" ON venues;
DROP POLICY IF EXISTS "owner_can_update" ON venues;
DROP POLICY IF EXISTS "owner_can_delete" ON venues;

-- 3. SELECT: anyone can read approved venues; creator can read their own
CREATE POLICY "public_can_read_approved" ON venues
  FOR SELECT
  USING (
    status = 'approved' OR created_by = auth.uid()
  );

-- 4. Rate-limiting function: max N venues per sliding window
CREATE OR REPLACE FUNCTION check_venue_rate_limit()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  recent_count integer;
BEGIN
  SELECT COUNT(*) INTO recent_count
  FROM venues
  WHERE created_by = auth.uid()
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN recent_count < 5;
END;
$$;

-- 5. INSERT: authenticated users only, with rate limit; created_by must match auth.uid()
CREATE POLICY "authenticated_can_insert" ON venues
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND created_by = auth.uid()
    AND check_venue_rate_limit()
  );

-- 6. UPDATE: owner can update their own venues
CREATE POLICY "owner_can_update" ON venues
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 7. DELETE: owner can delete their own venues
CREATE POLICY "owner_can_delete" ON venues
  FOR DELETE
  USING (created_by = auth.uid());
