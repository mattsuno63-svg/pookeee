-- Fix per 500 su signup: handle_new_user deve usare schema esplicito e sintassi compatibile

-- Rimuovi il trigger esistente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Ricrea la funzione con search_path esplicito e COALESCE per nickname
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, nickname)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'player'),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'nickname'), '')
  );
  RETURN NEW;
END;
$$;

-- Ricrea il trigger (usa EXECUTE PROCEDURE per compatibilità)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();
