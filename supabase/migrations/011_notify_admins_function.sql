-- Funzione per notificare tutti gli admin (creata/avviato torneo, ecc.)
CREATE OR REPLACE FUNCTION notify_admins(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT id, p_type, p_title, p_message, p_data
  FROM profiles
  WHERE role = 'admin';
END;
$$;

GRANT EXECUTE ON FUNCTION notify_admins(TEXT, TEXT, TEXT, JSONB) TO authenticated;
