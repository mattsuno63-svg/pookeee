-- Check-in massivo: il commerciante può segnare tutti come presenti in un colpo
CREATE OR REPLACE FUNCTION public.bulk_checkin_tournament(p_tournament_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_owner_id UUID;
  v_count INT;
BEGIN
  SELECT store_id INTO v_store_id FROM tournaments WHERE id = p_tournament_id;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Torneo non trovato';
  END IF;
  SELECT owner_id INTO v_owner_id FROM stores WHERE id = v_store_id;
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Non autorizzato: solo il titolare del negozio può fare check-in';
  END IF;

  UPDATE registrations
  SET status = 'present', checked_in_at = NOW(), updated_at = NOW()
  WHERE tournament_id = p_tournament_id
    AND status IN ('pending', 'confirmed');

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bulk_checkin_tournament(UUID) TO authenticated;
