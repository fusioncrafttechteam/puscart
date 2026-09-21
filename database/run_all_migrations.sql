-- Complete migration script to add all missing columns to orders table
-- Run this script in your PostgreSQL database

-- 1. Add delivery_address_id column (from update_orders_table.sql)
ALTER TABLE orders ADD COLUMN delivery_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL;

-- 2. Razorpay columns removed - skipping this section
-- Razorpay payment integration has been completely removed from the project

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address ON orders(delivery_address_id);

-- 4. Update existing orders to keep compatibility (optional)
-- This will set delivery_address_id to NULL for existing orders
-- UPDATE orders SET delivery_address_id = NULL WHERE delivery_address_id IS NULL;

-- 5. Verify the schema changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
ORDER BY ordinal_position;
