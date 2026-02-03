-- Admin e approvazione commercianti
-- Esegui in Supabase SQL Editor

-- 1. Aggiungi application_status agli owners
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('player', 'owner', 'admin'));

ALTER TABLE owners ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'pending' 
  CHECK (application_status IN ('pending', 'approved', 'rejected'));

-- NOTA: L'approvazione è SEMPRE manuale dall'admin. Nessuna auto-approvazione.

-- 2. Imposta baroccodigitale@gmail.com come admin
UPDATE profiles SET role = 'admin' 
WHERE id IN (SELECT id FROM auth.users WHERE email = 'baroccodigitale@gmail.com');

-- 3. Policy: admin può leggere tutti gli owners
CREATE POLICY "Admin can view all owners"
  ON owners FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Policy: admin può aggiornare application_status
CREATE POLICY "Admin can update owner application_status"
  ON owners FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
