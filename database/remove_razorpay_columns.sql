-- Remove Razorpay columns from orders table
-- This script cleans up the database after Razorpay payment removal

-- Drop Razorpay-specific indexes first
DROP INDEX IF EXISTS idx_orders_razorpay_order_id;
DROP INDEX IF EXISTS idx_orders_razorpay_payment_id;

-- Remove Razorpay columns from orders table
ALTER TABLE orders DROP COLUMN IF EXISTS razorpay_order_id;
ALTER TABLE orders DROP COLUMN IF EXISTS razorpay_payment_id;

-- Verify the orders table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create proper index for delivery_address_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);

-- Success message
SELECT 'Razorpay columns removed successfully from orders table' as status;
