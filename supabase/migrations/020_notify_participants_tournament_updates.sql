-- Notifiche ai partecipanti per ogni aggiornamento torneo: aggiungi p_type alla funzione esistente
CREATE OR REPLACE FUNCTION notify_tournament_participants(
  p_tournament_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_type TEXT DEFAULT 'tournament_message'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT r.player_id, COALESCE(NULLIF(TRIM(p_type), ''), 'tournament_message'), p_title, p_message, p_data
  FROM registrations r
  WHERE r.tournament_id = p_tournament_id
    AND r.status NOT IN ('withdrawn', 'cancelled');
END;
$$;

GRANT EXECUTE ON FUNCTION notify_tournament_participants(UUID, TEXT, TEXT, JSONB, TEXT) TO authenticated;
