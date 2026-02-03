-- Trigger per notificare utenti quando viene pubblicato un nuovo torneo

CREATE OR REPLACE FUNCTION notify_users_new_tournament()
RETURNS TRIGGER AS $$
DECLARE
  store_rec RECORD;
BEGIN
  -- Solo quando status passa a 'published'
  IF OLD.status != 'published' AND NEW.status = 'published' THEN
    
    -- Get store info
    SELECT name, city, province, logo_url INTO store_rec
    FROM stores
    WHERE id = NEW.store_id;
    
    -- Notifica utenti interessati (stessa provincia o gioco preferito)
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT DISTINCT
      p.id,
      'new_tournament_published',
      'Nuovo torneo disponibile!',
      'Nuovo torneo di ' || NEW.game || ' a ' || COALESCE(store_rec.city, store_rec.province, 'tua zona') || ': ' || NEW.name,
      jsonb_build_object(
        'tournament_id', NEW.id,
        'tournament_name', NEW.name,
        'game', NEW.game,
        'start_date', NEW.start_date,
        'store_name', store_rec.name
      )
    FROM profiles p
    WHERE p.role = 'player'
      AND (
        -- Utenti con gioco nei preferiti
        NEW.game = ANY(p.preferred_games)
        OR
        -- Utenti nella stessa provincia
        (p.province IS NOT NULL AND p.province = store_rec.province)
      )
      -- Non notificare il creatore del torneo
      AND p.id != (SELECT owner_id FROM stores WHERE id = NEW.store_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applica trigger
DROP TRIGGER IF EXISTS new_tournament_notification ON tournaments;
CREATE TRIGGER new_tournament_notification
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION notify_users_new_tournament();
