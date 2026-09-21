-- Create inventory_alerts table for stock monitoring
-- This table tracks low stock and out of stock alerts

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock')),
  stock INTEGER NOT NULL,
  threshold INTEGER NOT NULL,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id ON inventory_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_alert_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_created_at ON inventory_alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view inventory alerts
CREATE POLICY "Admins can view inventory alerts"
ON inventory_alerts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Only admins can insert inventory alerts
CREATE POLICY "Admins can insert inventory alerts"
ON inventory_alerts FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Only admins can update inventory alerts
CREATE POLICY "Admins can update inventory alerts"
ON inventory_alerts FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: No one can delete inventory alerts (use resolved flag instead)
CREATE POLICY "No one can delete inventory alerts"
ON inventory_alerts FOR DELETE
TO authenticated
USING (false);

-- Comment
COMMENT ON TABLE inventory_alerts IS 'Alerts for low stock and out of stock products';
