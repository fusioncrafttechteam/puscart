-- Fix Database Relationships After Razorpay Removal
-- Run this script in your Supabase SQL Editor to fix the orders relationship issue

-- Step 1: Remove Razorpay columns that are causing relationship conflicts
ALTER TABLE orders DROP COLUMN IF EXISTS razorpay_order_id;
ALTER TABLE orders DROP COLUMN IF EXISTS razorpay_payment_id;

-- Step 2: Remove Razorpay-specific indexes
DROP INDEX IF EXISTS idx_orders_razorpay_order_id;
DROP INDEX IF EXISTS idx_orders_razorpay_payment_id;

-- Step 3: Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_address_id ON orders(delivery_address_id);

-- Step 4: Verify order_items table structure
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Step 5: Refresh Supabase schema cache
-- This helps Supabase recognize the new table structure
NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the fix
-- This query should now work without errors
SELECT 
    o.*,
    oi.id as item_id,
    oi.quantity,
    oi.price,
    p.name as product_name,
    p.image as product_image
FROM orders o
INNER JOIN order_items oi ON o.id = oi.order_id
INNER JOIN products p ON oi.product_id = p.id
WHERE o.user_id = '885e5002-ae9f-4635-be9b-945f72ac4b40'
ORDER BY o.created_at DESC
LIMIT 5;

SELECT 'Database relationships fixed successfully!' as status;
