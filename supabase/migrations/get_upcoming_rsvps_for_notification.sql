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