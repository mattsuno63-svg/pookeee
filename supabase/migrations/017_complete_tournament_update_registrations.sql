-- complete_tournament: also set position/points on registrations
CREATE OR REPLACE FUNCTION public.complete_tournament(
  p_tournament_id UUID,
  p_results JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id UUID;
  v_owner_id UUID;
  v_result JSONB;
  r RECORD;
  v_stats JSONB;
  v_new_played INT;
  v_new_won INT;
  v_new_top3 INT;
BEGIN
  SELECT store_id INTO v_store_id FROM tournaments WHERE id = p_tournament_id;
  SELECT owner_id INTO v_owner_id FROM stores WHERE id = v_store_id;
  IF v_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Non autorizzato';
  END IF;

  UPDATE tournaments
  SET status = 'completed', results = p_results, updated_at = NOW()
  WHERE id = p_tournament_id;

  -- Set position and points on each registration
  FOR r IN SELECT * FROM jsonb_to_recordset(p_results) AS x(position INT, player_id UUID, points INT)
  LOOP
    UPDATE registrations
    SET position = r.position, points = r.points, updated_at = NOW()
    WHERE tournament_id = p_tournament_id AND player_id = r.player_id;
  END LOOP;

  -- Update profile stats
  FOR r IN SELECT * FROM jsonb_to_recordset(p_results) AS x(position INT, player_id UUID, points INT)
  LOOP
    SELECT stats INTO v_stats FROM profiles WHERE id = r.player_id;
    v_new_played := COALESCE((v_stats->>'played')::INT, 0) + 1;
    v_new_won := COALESCE((v_stats->>'won')::INT, 0) + CASE WHEN r.position = 1 THEN 1 ELSE 0 END;
    v_new_top3 := COALESCE((v_stats->>'top3')::INT, 0) + CASE WHEN r.position <= 3 THEN 1 ELSE 0 END;
    UPDATE profiles
    SET stats = jsonb_build_object('played', v_new_played, 'won', v_new_won, 'top3', v_new_top3)
    WHERE id = r.player_id;
  END LOOP;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_tournament(UUID, JSONB) TO authenticated;
