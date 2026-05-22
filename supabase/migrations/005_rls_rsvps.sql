-- =============================================================
-- Migration 005: RLS on rsvps + public RSVP count function
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Enable RLS on the rsvps table
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid duplicates on re-run
DROP POLICY IF EXISTS "own_select" ON rsvps;
DROP POLICY IF EXISTS "own_insert" ON rsvps;
DROP POLICY IF EXISTS "own_delete" ON rsvps;

-- 3. SELECT: user can only see their own RSVPs
CREATE POLICY "own_select" ON rsvps
  FOR SELECT
  USING (user_id = auth.uid());

-- 4. INSERT: user can only create RSVPs for themselves
CREATE POLICY "own_insert" ON rsvps
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 5. DELETE: user can only delete their own RSVPs
CREATE POLICY "own_delete" ON rsvps
  FOR DELETE
  USING (user_id = auth.uid());

-- 6. SECURITY DEFINER function: get RSVP count for a single venue
--    Bypasses RLS so anyone can see the crowd meter
DROP FUNCTION IF EXISTS get_venue_rsvp_count;
CREATE OR REPLACE FUNCTION get_venue_rsvp_count(venue_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::integer FROM rsvps WHERE rsvps.venue_id = get_venue_rsvp_count.venue_id;
$$;

-- 7. SECURITY DEFINER function: get all RSVP counts (for multi-venue queries)
DROP FUNCTION IF EXISTS get_all_venue_rsvp_counts;
CREATE OR REPLACE FUNCTION get_all_venue_rsvp_counts()
RETURNS TABLE (venue_id uuid, count bigint)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT rsvps.venue_id, COUNT(*)::bigint
  FROM rsvps
  GROUP BY rsvps.venue_id;
$$;

-- 8. Grant execute to anon and authenticated (the function is SECURITY DEFINER so data stays safe)
GRANT EXECUTE ON FUNCTION get_venue_rsvp_count TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_venue_rsvp_counts TO anon, authenticated;
