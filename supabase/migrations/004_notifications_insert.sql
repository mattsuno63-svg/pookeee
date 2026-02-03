-- Allow authenticated users to create notifications (e.g. when player registers, owner gets notified)
CREATE POLICY "Users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
