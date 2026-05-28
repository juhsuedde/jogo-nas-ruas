-- Migration 013: Replace all mock matches with real Brazil group stage matches
-- Grupo C da Copa 2026

-- 1. Clean existing matches (cascades to venue_matches)
DELETE FROM matches;

-- 2. Insert Brazil matches
-- Horários em BRT (UTC-3)
INSERT INTO matches (id, home_team, away_team, match_date, stage, group_name, stadium, match_city, match_order)
VALUES
  (
    gen_random_uuid(),
    'Brasil',
    'Marrocos',
    '2026-06-13 19:00:00-03'::timestamptz,
    'Grupo C',
    'C',
    'MetLife Stadium',
    'Nova York/Nova Jersey',
    1
  ),
  (
    gen_random_uuid(),
    'Brasil',
    'Haiti',
    '2026-06-19 21:30:00-03'::timestamptz,
    'Grupo C',
    'C',
    'Lincoln Financial Field',
    'Filadélfia',
    2
  ),
  (
    gen_random_uuid(),
    'Escócia',
    'Brasil',
    '2026-06-24 19:00:00-03'::timestamptz,
    'Grupo C',
    'C',
    'Hard Rock Stadium',
    'Miami',
    3
  );
