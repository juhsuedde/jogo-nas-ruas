-- =============================================================
-- Migration 006: cities table + city sync trigger
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  state text NOT NULL DEFAULT 'SP',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cities_name_state ON cities (name, state);

-- 2. Add city_id FK to venues (nullable for backward compat)
ALTER TABLE venues ADD COLUMN IF NOT EXISTS city_id uuid REFERENCES cities(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_venues_city_id ON venues (city_id);

-- 3. Function: ensure city exists and return its id
CREATE OR REPLACE FUNCTION ensure_city(city_name text, city_state text DEFAULT 'SP')
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  found_id uuid;
BEGIN
  SELECT id INTO found_id FROM cities WHERE name = ensure_city.city_name AND state = ensure_city.city_state LIMIT 1;
  IF found_id IS NULL THEN
    INSERT INTO cities (name, state) VALUES (ensure_city.city_name, ensure_city.city_state)
    RETURNING id INTO found_id;
  END IF;
  RETURN found_id;
END;
$$;

-- 4. Trigger: sync city_name when city_id is set; sync city_id when city_name is set
CREATE OR REPLACE FUNCTION sync_venue_city()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- If city_id is provided, sync city_name from cities
  IF NEW.city_id IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.city_id IS DISTINCT FROM OLD.city_id) THEN
    SELECT name INTO NEW.city_name FROM cities WHERE id = NEW.city_id;
  -- If city_name changed but city_id is null, look up or create the city
  ELSIF NEW.city_name IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.city_name IS DISTINCT FROM OLD.city_name) THEN
    NEW.city_id := ensure_city(NEW.city_name, COALESCE(NEW.state, 'SP'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_venue_city_trigger
  BEFORE INSERT OR UPDATE OF city_id, city_name ON venues
  FOR EACH ROW
  EXECUTE FUNCTION sync_venue_city();

-- 5. Backfill: create cities for existing city_name values that don't have a city_id yet
UPDATE venues
SET city_id = ensure_city(city_name, COALESCE(state, 'SP'))
WHERE city_id IS NULL AND city_name IS NOT NULL;
