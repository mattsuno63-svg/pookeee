-- Trigger per notificare i partecipanti quando un torneo viene modificato

CREATE OR REPLACE FUNCTION notify_tournament_participants()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cambiano info rilevanti, notifica gli iscritti
  IF (OLD.name != NEW.name 
      OR OLD.start_date != NEW.start_date 
      OR OLD.start_time != NEW.start_time
      OR OLD.description != NEW.description
      OR OLD.rules != NEW.rules) THEN
    
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT 
      r.player_id,
      'tournament_updated',
      'Torneo modificato',
      'Il torneo "' || NEW.name || '" è stato aggiornato. Controlla le nuove informazioni.',
      jsonb_build_object(
        'tournament_id', NEW.id,
        'tournament_name', NEW.name,
        'changes', jsonb_build_object(
          'name_changed', OLD.name != NEW.name,
          'date_changed', OLD.start_date != NEW.start_date,
          'time_changed', OLD.start_time != NEW.start_time
        )
      )
    FROM registrations r
    WHERE r.tournament_id = NEW.id
      AND r.status IN ('pending', 'confirmed', 'present');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Applica trigger
DROP TRIGGER IF EXISTS tournament_update_notification ON tournaments;
CREATE TRIGGER tournament_update_notification
  AFTER UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION notify_tournament_participants();
