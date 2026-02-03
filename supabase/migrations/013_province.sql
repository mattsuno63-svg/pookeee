-- Provincia al posto di città per filtraggio tornei
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS province TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);
CREATE INDEX IF NOT EXISTS idx_stores_province ON stores(province);
