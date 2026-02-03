-- Funzione per aggiornare subscription_status a 'expired' quando trial_ends_at è passato
-- Può essere chiamata manualmente o schedulata con pg_cron

CREATE OR REPLACE FUNCTION public.expire_expired_trials()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE owners
  SET subscription_status = 'expired'
  WHERE subscription_status = 'trial'
    AND trial_ends_at IS NOT NULL
    AND trial_ends_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_expired_trials() TO authenticated;

-- Trigger per aggiornare automaticamente quando trial_ends_at è passato (solo se trial)
-- Nota: questo trigger si attiva solo su UPDATE. Per check automatici, usa pg_cron o chiama expire_expired_trials() periodicamente.

CREATE OR REPLACE FUNCTION public.check_trial_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.subscription_status = 'trial' 
     AND NEW.trial_ends_at IS NOT NULL 
     AND NEW.trial_ends_at < NOW() THEN
    NEW.subscription_status := 'expired';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER check_trial_expiration_trigger
  BEFORE INSERT OR UPDATE ON owners
  FOR EACH ROW
  EXECUTE FUNCTION public.check_trial_expiration();
