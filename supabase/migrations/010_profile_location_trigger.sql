-- Profilo: salva city, lat, lon da metadata (per player con conferma email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_meta JSONB;
  v_business_name TEXT;
  v_slug TEXT;
  v_trial_ends TIMESTAMPTZ;
  v_social JSONB := '{}';
  v_city TEXT;
  v_lat DECIMAL;
  v_lon DECIMAL;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'player');
  v_meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  v_city := NULLIF(TRIM(v_meta->>'city'), '');
  v_lat := (v_meta->>'latitude')::DECIMAL;
  v_lon := (v_meta->>'longitude')::DECIMAL;

  -- Crea sempre il profilo (con city, lat, lon se presenti)
  INSERT INTO public.profiles (id, role, nickname, city, latitude, longitude)
  VALUES (
    NEW.id,
    v_role,
    NULLIF(TRIM(v_meta->>'nickname'), ''),
    v_city,
    CASE WHEN v_lat IS NOT NULL AND v_lat BETWEEN -90 AND 90 THEN v_lat ELSE NULL END,
    CASE WHEN v_lon IS NOT NULL AND v_lon BETWEEN -180 AND 180 THEN v_lon ELSE NULL END
  );

  -- Se gestore, crea owner e prima sede
  IF v_role = 'owner' THEN
    v_business_name := NULLIF(TRIM(v_meta->>'business_name'), '');
    IF v_business_name IS NULL OR length(v_business_name) < 2 THEN
      RAISE EXCEPTION 'business_name obbligatorio per registrazione gestore';
    END IF;

    -- Slug da business_name (solo lettere, numeri, trattini)
    v_slug := lower(regexp_replace(v_business_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    v_slug := regexp_replace(v_slug, '\s+', '-', 'g');
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    IF length(v_slug) < 2 THEN
      v_slug := 'negozio-' || substr(NEW.id::text, 1, 8);
    END IF;
    IF EXISTS (SELECT 1 FROM stores WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substr(NEW.id::text, 1, 8);
    END IF;

    v_trial_ends := NOW() + INTERVAL '4 days';

    IF v_meta->>'instagram' IS NOT NULL AND trim(v_meta->>'instagram') != '' THEN
      v_social := v_social || jsonb_build_object('instagram', trim(v_meta->>'instagram'));
    END IF;
    IF v_meta->>'facebook' IS NOT NULL AND trim(v_meta->>'facebook') != '' THEN
      v_social := v_social || jsonb_build_object('facebook', trim(v_meta->>'facebook'));
    END IF;
    IF v_meta->>'discord' IS NOT NULL AND trim(v_meta->>'discord') != '' THEN
      v_social := v_social || jsonb_build_object('discord', trim(v_meta->>'discord'));
    END IF;
    IF v_meta->>'whatsapp' IS NOT NULL AND trim(v_meta->>'whatsapp') != '' THEN
      v_social := v_social || jsonb_build_object('whatsapp', trim(v_meta->>'whatsapp'));
    END IF;

    INSERT INTO public.owners (id, business_name, vat_number, business_email, business_phone, trial_ends_at, application_status)
    VALUES (NEW.id, v_business_name, NULLIF(trim(v_meta->>'vat_number'), ''), NULLIF(trim(v_meta->>'business_email'), ''), NULLIF(trim(v_meta->>'business_phone'), ''), v_trial_ends, 'pending');

    INSERT INTO public.stores (owner_id, name, slug, description, address, city, postal_code, phone, email, social_links)
    VALUES (NEW.id, v_business_name, v_slug, NULLIF(trim(v_meta->>'description'), ''), NULLIF(trim(v_meta->>'address'), ''), NULLIF(trim(v_meta->>'city'), ''), NULLIF(trim(v_meta->>'postal_code'), ''), COALESCE(NULLIF(trim(v_meta->>'phone'), ''), NULLIF(trim(v_meta->>'business_phone'), '')), COALESCE(NULLIF(trim(v_meta->>'emailStore'), ''), NULLIF(trim(v_meta->>'business_email'), '')), v_social);
  END IF;

  RETURN NEW;
END;
$$;
