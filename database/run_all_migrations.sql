-- Complete migration script to add all missing columns to orders table
-- Run this script in your PostgreSQL database

-- 1. Add delivery_address_id column (from update_orders_table.sql)
ALTER TABLE orders ADD COLUMN delivery_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL;

-- 2. Add Razorpay payment columns (from add_razorpay_columns.sql)
ALTER TABLE orders ADD COLUMN razorpay_order_id TEXT;
ALTER TABLE orders ADD COLUMN razorpay_payment_id TEXT;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders(delivery_address_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id ON orders(razorpay_payment_id);

-- 4. Update existing orders to keep compatibility (optional)
-- This will set delivery_address_id to NULL for existing orders
-- UPDATE orders SET delivery_address_id = NULL WHERE delivery_address_id IS NULL;

-- 5. Verify the schema changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
