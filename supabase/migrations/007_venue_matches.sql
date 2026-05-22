-- =============================================================
-- Migration 007: venue_matches junction table + sync trigger
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Create venue_matches junction table
CREATE TABLE IF NOT EXISTS venue_matches (
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (venue_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_venue_matches_match_id ON venue_matches (match_id);

-- 2. Migrate existing data from venues.match_ids to venue_matches
INSERT INTO venue_matches (venue_id, match_id)
SELECT v.id, unnest(v.match_ids)
FROM venues v
WHERE v.match_ids IS NOT NULL AND array_length(v.match_ids, 1) > 0
ON CONFLICT DO NOTHING;

-- 3. Function: sync venues.match_ids array from venue_matches table
CREATE OR REPLACE FUNCTION sync_venue_match_ids()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  venue_uuid uuid;
BEGIN
  venue_uuid := COALESCE(NEW.venue_id, OLD.venue_id);

  UPDATE venues
  SET match_ids = ARRAY(
    SELECT vm.match_id
    FROM venue_matches vm
    WHERE vm.venue_id = venue_uuid
    ORDER BY vm.match_id
  )
  WHERE id = venue_uuid;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_venue_match_ids_trigger
  AFTER INSERT OR DELETE ON venue_matches
  FOR EACH ROW
  EXECUTE FUNCTION sync_venue_match_ids();

-- 4. Function: add match to venue (convenience for client code)
CREATE OR REPLACE FUNCTION add_venue_matches(p_venue_id uuid, p_match_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO venue_matches (venue_id, match_id)
  SELECT p_venue_id, unnest(p_match_ids)
  ON CONFLICT DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION add_venue_matches TO authenticated;
