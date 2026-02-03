-- Consenti lettura pubblica delle registrazioni per tornei completati (per profilo giocatore pubblico)
CREATE POLICY "Public can view registrations of completed tournaments"
  ON registrations FOR SELECT
  USING (
    tournament_id IN (SELECT id FROM tournaments WHERE status = 'completed')
  );
