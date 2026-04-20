-- Add delivery_address_id to orders table
ALTER TABLE orders ADD COLUMN delivery_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders(delivery_address_id);

-- Update existing orders to keep compatibility (optional - for existing data)
-- This will set delivery_address_id to NULL for existing orders
-- UPDATE orders SET delivery_address_id = NULL WHERE delivery_address_id IS NULL;
