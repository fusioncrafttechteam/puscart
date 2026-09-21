-- Create delivery_settings table
CREATE TABLE IF NOT EXISTS delivery_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  free_delivery_limit DECIMAL(10,2) NOT NULL DEFAULT 500.00,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 40.00,
  enable_delivery_charge BOOLEAN DEFAULT true,
  free_delivery_message VARCHAR(255) DEFAULT 'Free delivery above ₹500',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default delivery settings
INSERT INTO delivery_settings (free_delivery_limit, delivery_fee, enable_delivery_charge, free_delivery_message)
VALUES (500.00, 40.00, true, 'Free delivery above ₹500')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read and update delivery settings
CREATE POLICY "Admins can view delivery settings"
  ON delivery_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update delivery settings"
  ON delivery_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create policy to allow all authenticated users to read delivery settings (for cart/checkout)
CREATE POLICY "All authenticated users can view delivery settings"
  ON delivery_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER delivery_settings_updated_at_trigger
  BEFORE UPDATE ON delivery_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_settings_updated_at();
