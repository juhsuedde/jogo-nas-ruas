-- =============================================================
-- Migration 009: Push notifications — functions + cron setup
-- =============================================================
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/nemrqkkuptdikiqqgaho/sql/new
-- =============================================================

-- 1. Fix get_upcoming_rsvps_for_notification — compute match_name
--    from home_team / away_team (the column doesn't exist in DB).
DROP FUNCTION IF EXISTS get_upcoming_rsvps_for_notification;
CREATE OR REPLACE FUNCTION get_upcoming_rsvps_for_notification()
RETURNS TABLE (
  rsvp_id uuid,
  user_id uuid,
  venue_id uuid,
  venue_name text,
  match_id uuid,
  match_name text,
  token text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id::uuid AS rsvp_id,
    r.user_id::uuid,
    v.id::uuid AS venue_id,
    v.name::text AS venue_name,
    m.id::uuid AS match_id,
    (m.home_team || ' x ' || m.away_team)::text AS match_name,
    u.fcm_token::text AS token
  FROM rsvps r
  JOIN venues v ON r.venue_id = v.id
  JOIN matches m ON r.match_id = m.id
  JOIN user_fcm_tokens u ON r.user_id = u.user_id
  WHERE
    m.match_date > NOW() + interval '45 minutes'
    AND m.match_date <= NOW() + interval '75 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM notifications_sent ns
      WHERE ns.rsvp_id = r.id AND ns.type = 'match_reminder'
    )
  ORDER BY m.match_date ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_upcoming_rsvps_for_notification TO service_role;

-- 2. New function: find users with FCM tokens who did NOT RSVP for
--    upcoming matches. These get a general reminder to find a venue.
CREATE OR REPLACE FUNCTION get_upcoming_matches_general()
RETURNS TABLE (
  user_id uuid,
  match_id uuid,
  match_name text,
  match_date timestamptz,
  token text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.user_id::uuid,
    m.id::uuid AS match_id,
    (m.home_team || ' x ' || m.away_team)::text AS match_name,
    m.match_date::timestamptz,
    u.fcm_token::text AS token
  FROM user_fcm_tokens u
  CROSS JOIN LATERAL (
    SELECT id, home_team, away_team, match_date
    FROM matches
    WHERE match_date > NOW() + interval '45 minutes'
      AND match_date <= NOW() + interval '75 minutes'
  ) m
  WHERE NOT EXISTS (
    -- User did NOT RSVP for this match
    SELECT 1 FROM rsvps r
    WHERE r.user_id = u.user_id AND r.match_id = m.id
  )
  AND NOT EXISTS (
    -- User hasn't received a general reminder for this match
    SELECT 1 FROM notifications_sent ns
    WHERE ns.user_id = u.user_id
      AND ns.match_id = m.id
      AND ns.type = 'general_match_reminder'
  )
  ORDER BY m.match_date ASC, u.user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_upcoming_matches_general TO service_role;

-- 3. Add match_id column to notifications_sent (needed for general reminders)
ALTER TABLE notifications_sent ADD COLUMN IF NOT EXISTS match_id uuid REFERENCES matches(id) ON DELETE SET NULL;

-- 4. Cron schedule to invoke the edge function every 15 min
--    Requires pg_cron + pg_net extensions enabled (enable via Supabase Dashboard).
--    The service role key below is just a placeholder — set your real service_role key.
--    For production, use a stronger key or restrict the HTTP call.

-- SELECT cron.schedule(
--   'send-push-notifications',
--   '*/15 * * * *',
--   $$
--   SELECT net.http_post(
--     url:='https://nemrqkkuptdikiqqgaho.supabase.co/functions/v1/send-push-notification',
--     headers:=jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lbXJxa2t1cHRkaWtpcXFnYWhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTExNDYwNSwiZXhwIjoyMDk0NjkwNjA1fQ.6cRP94pMGj7As6LDh2sQK8WcQ6RsH24N4-kg6nQBl1E'
--     ),
--     body:='{}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- NOTE: Uncomment the cron.schedule above after enabling extensions:
--   1. Go to Supabase Dashboard → Database → Extensions
--   2. Enable pg_cron and pg_net
--   3. Replace the Authorization Bearer token with your actual service_role key
--   4. Run the SELECT cron.schedule(...) statement
