-- Aggiungi gallery_images per le immagini del negozio
ALTER TABLE stores ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]';
