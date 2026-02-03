-- Storage buckets per le immagini
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('store-logos', 'store-logos', true),
  ('store-banners', 'store-banners', true),
  ('tournament-images', 'tournament-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies per avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar" 
  ON storage.objects FOR INSERT 
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(objects.name))[1]
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" 
  ON storage.objects FOR UPDATE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(objects.name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" 
  ON storage.objects FOR DELETE 
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(objects.name))[1]
  );

-- Policies per store-logos
DROP POLICY IF EXISTS "Store logos are publicly accessible" ON storage.objects;
CREATE POLICY "Store logos are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'store-logos');

DROP POLICY IF EXISTS "Store owners can manage logos" ON storage.objects;
CREATE POLICY "Store owners can manage logos" 
  ON storage.objects FOR ALL 
  USING (
    bucket_id = 'store-logos' 
    AND auth.uid() IN (
      SELECT owner_id FROM stores WHERE id::text = (storage.foldername(objects.name))[1]
    )
  );

-- Policies per store-banners
DROP POLICY IF EXISTS "Store banners are publicly accessible" ON storage.objects;
CREATE POLICY "Store banners are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'store-banners');

DROP POLICY IF EXISTS "Store owners can manage banners" ON storage.objects;
CREATE POLICY "Store owners can manage banners" 
  ON storage.objects FOR ALL 
  USING (
    bucket_id = 'store-banners' 
    AND auth.uid() IN (
      SELECT owner_id FROM stores WHERE id::text = (storage.foldername(objects.name))[1]
    )
  );

-- Policies per tournament-images
DROP POLICY IF EXISTS "Tournament images are publicly accessible" ON storage.objects;
CREATE POLICY "Tournament images are publicly accessible" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'tournament-images');

DROP POLICY IF EXISTS "Tournament owners can manage images" ON storage.objects;
CREATE POLICY "Tournament owners can manage images" 
  ON storage.objects FOR ALL 
  USING (
    bucket_id = 'tournament-images' 
    AND auth.uid() IN (
      SELECT s.owner_id 
      FROM tournaments t
      JOIN stores s ON s.id = t.store_id
      WHERE t.id::text = (storage.foldername(objects.name))[1]
    )
  );
