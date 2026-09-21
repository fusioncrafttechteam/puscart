-- Add public policy to allow unauthenticated users to read delivery settings
-- This is needed for the footer to display free delivery threshold to all visitors

CREATE POLICY "Public users can view delivery settings"
  ON delivery_settings
  FOR SELECT
  TO anon
  USING (true);
