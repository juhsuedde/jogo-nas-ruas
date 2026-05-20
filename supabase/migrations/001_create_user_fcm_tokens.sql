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