-- Fix: profili con role=owner ma senza riga in owners (es. gestori registrati prima del trigger 006)
-- application_status=pending: l'admin deve approvare manualmente
INSERT INTO owners (id, business_name, trial_ends_at, application_status)
SELECT p.id, 'La mia attività', NOW() + INTERVAL '4 days', 'pending'
FROM profiles p
LEFT JOIN owners o ON o.id = p.id
WHERE p.role = 'owner' AND o.id IS NULL
ON CONFLICT (id) DO NOTHING;
