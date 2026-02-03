-- Rimuovi vecchio UNIQUE case-sensitive, aggiungi case-insensitive
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_nickname_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_nickname_lower
  ON profiles (LOWER(TRIM(nickname)))
  WHERE nickname IS NOT NULL;

-- Funzione per verificare disponibilità nickname (case-insensitive)
-- Chiamabile da anon per registrazione, da authenticated per modifica profilo
CREATE OR REPLACE FUNCTION public.check_nickname_available(
  p_nickname TEXT,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_nickname IS NULL OR TRIM(p_nickname) = '' THEN
    RETURN FALSE;
  END IF;
  RETURN NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE LOWER(TRIM(nickname)) = LOWER(TRIM(p_nickname))
      AND (p_exclude_user_id IS NULL OR id != p_exclude_user_id)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_nickname_available(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.check_nickname_available(TEXT, UUID) TO authenticated;
