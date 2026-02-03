-- Aggiunge sistema di approvazione per le sedi
-- Ogni sede creata deve essere approvata dall'admin

-- 1. Aggiungi campo approval_status alla tabella stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
  CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- 2. Imposta tutte le sedi esistenti come approvate (retrocompatibilità)
UPDATE stores SET approval_status = 'approved' WHERE approval_status IS NULL;

-- 3. Modifica policy per gli stores: solo le sedi approvate sono pubbliche
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON stores;
CREATE POLICY "Stores are viewable by everyone" 
  ON stores FOR SELECT 
  USING (is_active = true AND approval_status = 'approved');

-- 4. Policy: admin può vedere tutte le sedi (anche quelle in pending)
CREATE POLICY "Admin can view all stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Policy: admin può aggiornare approval_status delle sedi
CREATE POLICY "Admin can update store approval_status"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Policy: owner può vedere le proprie sedi (indipendentemente da approval_status)
-- Questa policy esiste già, ma la ricreo per assicurarmi che funzioni correttamente
DROP POLICY IF EXISTS "Owners can view all own stores" ON stores;
CREATE POLICY "Owners can view all own stores" 
  ON stores FOR SELECT 
  TO authenticated
  USING (owner_id = auth.uid());

-- 7. Aggiungi indice per performance
CREATE INDEX IF NOT EXISTS idx_stores_approval_status ON stores(approval_status);

-- 8. Funzione per notificare gli admin quando viene creata una nuova sede
CREATE OR REPLACE FUNCTION notify_admins_new_store()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserisce notifiche per tutti gli admin
  INSERT INTO notifications (user_id, type, title, message, data)
  SELECT 
    p.id,
    'new_store_pending',
    'Nuova sede in attesa di approvazione',
    'La sede "' || NEW.name || '" richiede l''approvazione.',
    jsonb_build_object('store_id', NEW.id, 'store_name', NEW.name)
  FROM profiles p
  WHERE p.role = 'admin';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Trigger per notificare gli admin
DROP TRIGGER IF EXISTS notify_admins_on_new_store ON stores;
CREATE TRIGGER notify_admins_on_new_store
  AFTER INSERT ON stores
  FOR EACH ROW
  WHEN (NEW.approval_status = 'pending')
  EXECUTE FUNCTION notify_admins_new_store();

-- 10. Funzione per notificare l'owner quando la sede viene approvata/rifiutata
CREATE OR REPLACE FUNCTION notify_owner_store_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo se lo stato di approvazione è cambiato
  IF OLD.approval_status != NEW.approval_status THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.owner_id,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'store_approved'
        WHEN NEW.approval_status = 'rejected' THEN 'store_rejected'
        ELSE 'store_status_changed'
      END,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'Sede approvata!'
        WHEN NEW.approval_status = 'rejected' THEN 'Sede rifiutata'
        ELSE 'Stato sede modificato'
      END,
      CASE 
        WHEN NEW.approval_status = 'approved' THEN 'La tua sede "' || NEW.name || '" è stata approvata e ora è visibile pubblicamente.'
        WHEN NEW.approval_status = 'rejected' THEN 'La tua sede "' || NEW.name || '" è stata rifiutata.'
        ELSE 'Lo stato della tua sede "' || NEW.name || '" è stato modificato.'
      END,
      jsonb_build_object('store_id', NEW.id, 'store_name', NEW.name, 'approval_status', NEW.approval_status)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Trigger per notificare l'owner
DROP TRIGGER IF EXISTS notify_owner_on_store_status_change ON stores;
CREATE TRIGGER notify_owner_on_store_status_change
  AFTER UPDATE ON stores
  FOR EACH ROW
  WHEN (OLD.approval_status IS DISTINCT FROM NEW.approval_status)
  EXECUTE FUNCTION notify_owner_store_status();
