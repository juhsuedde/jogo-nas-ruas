-- Tabela para registrar notificações push enviadas
CREATE TABLE IF NOT EXISTS notifications_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rsvp_id uuid REFERENCES rsvps(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'match_reminder',
  sent_at timestamptz DEFAULT NOW(),
  fcm_response jsonb,
  created_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_sent_rsvp ON notifications_sent(rsvp_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_user ON notifications_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_type ON notifications_sent(type);