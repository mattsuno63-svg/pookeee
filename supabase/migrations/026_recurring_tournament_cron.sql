-- Funzione per generare automaticamente tornei ricorrenti

CREATE OR REPLACE FUNCTION generate_recurring_tournaments()
RETURNS void AS $$
DECLARE
  schedule_rec RECORD;
  next_date DATE;
  current_dow INT;
BEGIN
  FOR schedule_rec IN 
    SELECT * FROM recurring_schedules 
    WHERE is_active = true 
      AND (next_occurrence IS NULL OR next_occurrence <= CURRENT_DATE)
  LOOP
    -- Calcola prossima data
    IF schedule_rec.frequency = 'weekly' THEN
      -- Prossimo giorno della settimana
      current_dow := EXTRACT(DOW FROM CURRENT_DATE)::int;
      next_date := CURRENT_DATE + ((schedule_rec.day_of_week - current_dow + 7) % 7)::int;
      -- Se è oggi ma l'ora è già passata, o se è passato, vai alla prossima settimana
      IF next_date <= CURRENT_DATE THEN
        next_date := next_date + 7;
      END IF;
      
    ELSIF schedule_rec.frequency = 'biweekly' THEN
      -- Come weekly ma ogni 2 settimane
      current_dow := EXTRACT(DOW FROM CURRENT_DATE)::int;
      next_date := CURRENT_DATE + ((schedule_rec.day_of_week - current_dow + 7) % 7)::int;
      IF next_date <= CURRENT_DATE THEN
        next_date := next_date + 14;
      END IF;
      
    ELSIF schedule_rec.frequency = 'monthly' THEN
      -- Stesso giorno del mese
      next_date := MAKE_DATE(
        EXTRACT(YEAR FROM CURRENT_DATE)::int,
        EXTRACT(MONTH FROM CURRENT_DATE)::int,
        LEAST(schedule_rec.day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day'))::int)
      );
      -- Se è passato, prossimo mese
      IF next_date <= CURRENT_DATE THEN
        next_date := MAKE_DATE(
          EXTRACT(YEAR FROM (CURRENT_DATE + INTERVAL '1 month'))::int,
          EXTRACT(MONTH FROM (CURRENT_DATE + INTERVAL '1 month'))::int,
          LEAST(schedule_rec.day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '1 month - 1 day'))::int)
        );
      END IF;
    END IF;
    
    -- Crea torneo se non esiste già per questa data
    IF NOT EXISTS (
      SELECT 1 FROM tournaments 
      WHERE recurring_schedule_id = schedule_rec.id 
        AND start_date = next_date
    ) THEN
      INSERT INTO tournaments (
        store_id, name, game, format, description, rules, prizes,
        start_date, start_time, max_participants, min_participants,
        entry_fee, registration_closes_minutes_before,
        is_recurring, recurring_schedule_id, status, image_url
      )
      SELECT 
        schedule_rec.store_id,
        (schedule_rec.template->>'name')::text,
        (schedule_rec.template->>'game')::text,
        (schedule_rec.template->>'format')::text,
        (schedule_rec.template->>'description')::text,
        (schedule_rec.template->>'rules')::text,
        (schedule_rec.template->>'prizes')::text,
        next_date,
        schedule_rec.time,
        (schedule_rec.template->>'max_participants')::int,
        COALESCE((schedule_rec.template->>'min_participants')::int, 2),
        COALESCE((schedule_rec.template->>'entry_fee')::decimal, 0),
        COALESCE((schedule_rec.template->>'registration_closes_minutes_before')::int, 30),
        true,
        schedule_rec.id,
        'published',
        (schedule_rec.template->>'image_url')::text;
    END IF;
    
    -- Aggiorna next_occurrence
    UPDATE recurring_schedules 
    SET next_occurrence = next_date 
    WHERE id = schedule_rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commento: Per eseguire automaticamente questa funzione ogni giorno,
-- devi configurare un Cron Job in Supabase Dashboard o creare un Edge Function
-- schedulata che chiama: SELECT generate_recurring_tournaments();
