-- Migration 012: Venue sponsored pins (monetização)
-- Permite marcar locais como patrocinados com data de expiração.

ALTER TABLE venues
ADD COLUMN IF NOT EXISTS sponsored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsored_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_venues_sponsored ON venues (sponsored)
  WHERE sponsored = true;
