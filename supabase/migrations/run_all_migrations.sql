-- ============================================================
-- MIGRATIONS FOR JOGO NAS RUAS
-- Run these in the Supabase SQL Dashboard or via CLI
-- ============================================================

-- ============================================================
-- MIGRATION 001: Create user_fcm_tokens table
-- ============================================================

-- Tabela para armazenar tokens FCM dos usuários
CREATE TABLE IF NOT EXISTS user_fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fcm_token text NOT NULL,
  device_type text DEFAULT 'web',
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user ON user_fcm_tokens(user_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_user_fcm_tokens_updated_at ON user_fcm_tokens;
CREATE TRIGGER update_user_fcm_tokens_updated_at
  BEFORE UPDATE ON user_fcm_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir/atualizar token FCM do usuário (usado pelo frontend)
CREATE OR REPLACE FUNCTION upsert_user_fcm_token(
  p_user_id uuid,
  p_token text,
  p_device_type text DEFAULT 'web'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_fcm_tokens (user_id, fcm_token, device_type)
  VALUES (p_user_id, p_token, p_device_type)
  ON CONFLICT (user_id) DO UPDATE
  SET fcm_token = EXCLUDED.fcm_token,
      device_type = EXCLUDED.device_type,
      updated_at = NOW();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_user_fcm_token TO anon, authenticated;


-- ============================================================
-- MIGRATION 002: Create notifications_sent table
-- ============================================================

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


-- ============================================================
-- MIGRATION 003: Create get_upcoming_rsvps_for_notification function
-- ============================================================

-- Dropar função existente se houver conflito de tipo
DROP FUNCTION IF EXISTS get_upcoming_rsvps_for_notification();

-- Função para buscar RSVPs de jogos que começam em ~1 hora
-- Usada pela Edge Function de notificações push

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
    m.match_name::text AS match_name,
    u.fcm_token::text AS token
  FROM rsvps r
  JOIN venues v ON r.venue_id = v.id
  JOIN matches m ON r.match_id = m.id
  JOIN user_fcm_tokens u ON r.user_id = u.user_id
  WHERE 
    -- Jogo que começa entre 45 e 75 minutos a partir de agora
    m.match_date > NOW() + interval '45 minutes'
    AND m.match_date <= NOW() + interval '75 minutes'
    -- Não foi notificado ainda (verificar na tabela notifications_sent)
    AND NOT EXISTS (
      SELECT 1 FROM notifications_sent ns 
      WHERE ns.rsvp_id = r.id AND ns.type = 'match_reminder'
    )
  ORDER BY m.match_date ASC;
END;
$$;

-- Permissão para executar a função
GRANT EXECUTE ON FUNCTION get_upcoming_rsvps_for_notification TO service_role;


-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verificar se as tabelas foram criadas
SELECT 'user_fcm_tokens' as table_name, count(*) as row_count FROM user_fcm_tokens;
SELECT 'notifications_sent' as table_name, count(*) as row_count FROM notifications_sent;

-- Verificar se as funções existem
SELECT proname FROM pg_proc WHERE proname = 'upsert_user_fcm_token';
SELECT proname FROM pg_proc WHERE proname = 'get_upcoming_rsvps_for_notification';