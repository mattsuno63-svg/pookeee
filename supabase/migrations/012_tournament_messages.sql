-- Messaggi del gruppo torneo (solo owner può scrivere, partecipanti leggono)
CREATE TABLE IF NOT EXISTS tournament_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_messages_tournament ON tournament_messages(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_messages_created ON tournament_messages(created_at);

ALTER TABLE tournament_messages ENABLE ROW LEVEL SECURITY;

-- Owner del torneo può inserire messaggi
CREATE POLICY "Tournament owner can insert messages"
  ON tournament_messages FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND tournament_id IN (
      SELECT t.id FROM tournaments t
      JOIN stores s ON t.store_id = s.id
      WHERE s.owner_id = auth.uid()
    )
  );

-- Owner e partecipanti possono leggere
CREATE POLICY "Owner and participants can read messages"
  ON tournament_messages FOR SELECT
  USING (
    author_id = auth.uid()
    OR tournament_id IN (
      SELECT t.id FROM tournaments t
      JOIN stores s ON t.store_id = s.id
      WHERE s.owner_id = auth.uid()
    )
    OR tournament_id IN (
      SELECT tournament_id FROM registrations
      WHERE player_id = auth.uid()
      AND status NOT IN ('withdrawn', 'cancelled')
    )
  );

-- Nessun UPDATE/DELETE (solo insert, messaggi permanenti)

-- Notifica tutti i partecipanti quando l'owner posta
CREATE OR REPLACE FUNCTION notify_tournament_participants(
  p_tournament_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT r.player_id, 'tournament_message', p_title, p_message, p_data
  FROM registrations r
  WHERE r.tournament_id = p_tournament_id
    AND r.status NOT IN ('withdrawn', 'cancelled');
END;
$$;

GRANT EXECUTE ON FUNCTION notify_tournament_participants(UUID, TEXT, TEXT, JSONB) TO authenticated;
