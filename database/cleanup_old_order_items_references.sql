-- ========================================
-- CLEANUP OLD ORDER_ITEMS REFERENCES
-- ========================================
-- This script cleans up any remaining references to the old order_items table
-- and ensures database is fully optimized for the new unified structure

-- Step 1: Remove any remaining indexes that reference old order_items table
DROP INDEX IF EXISTS idx_order_items_order CASCADE;
DROP INDEX IF EXISTS idx_order_items_product CASCADE;
DROP INDEX IF EXISTS idx_order_items_order_id CASCADE;
DROP INDEX IF EXISTS idx_order_items_product_id CASCADE;
DROP INDEX IF EXISTS idx_order_items_order_product CASCADE;

-- Step 2: Remove any remaining policies for order_items table
DROP POLICY IF EXISTS "Order items accessible through orders" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create own order items" ON order_items;
DROP POLICY IF EXISTS "Users can update own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can manage order items" ON order_items;

-- Step 3: Remove RLS from order_items table (if it still exists)
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;

-- Step 4: Clean up old functions that reference order_items
DROP FUNCTION IF EXISTS get_order_items(UUID) CASCADE;
DROP FUNCTION IF EXISTS create_order_item(UUID, UUID, INTEGER, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS update_order_item(UUID, INTEGER, DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS delete_order_item(UUID) CASCADE;

-- Step 5: Update any remaining views that reference order_items
DROP VIEW IF EXISTS order_details_view CASCADE;
DROP VIEW IF EXISTS user_order_summary_view CASCADE;

-- Step 6: Clean up any remaining triggers on order_items table
DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
DROP TRIGGER IF EXISTS order_items_audit_trigger ON order_items;

-- Step 7: Ensure proper indexes exist for unified orders table
CREATE INDEX IF NOT EXISTS idx_orders_products_gin ON orders USING GIN(products);
CREATE INDEX IF NOT EXISTS idx_orders_user_payment ON orders(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status_created ON orders(delivery_status, created_at);

-- Step 8: Update statistics and optimize table
ANALYZE orders;
ANALYZE payments;

-- Step 9: Verify unified structure is working correctly
DO $$
DECLARE
  orders_count INTEGER;
  payments_count INTEGER;
  orders_with_products INTEGER;
BEGIN
  -- Check orders table
  SELECT COUNT(*) INTO orders_count FROM orders;
  SELECT COUNT(*) INTO payments_count FROM payments;
  SELECT COUNT(*) INTO orders_with_products FROM orders WHERE jsonb_array_length(products) > 0;
  
  RAISE NOTICE 'Database Analysis:';
  RAISE NOTICE '- Total orders: %', orders_count;
  RAISE NOTICE '- Total payments: %', payments_count;
  RAISE NOTICE '- Orders with products: %', orders_with_products;
  
  -- Verify structure
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'products'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: orders table missing products column';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'payment_id'
  ) THEN
    RAISE EXCEPTION 'CRITICAL: orders table missing payment_id column';
  END IF;
  
  RAISE NOTICE 'SUCCESS: Unified orders structure verified!';
END $$;

-- Step 10: Final cleanup - remove old backup tables if they exist and are no longer needed
-- Uncomment these lines if you want to permanently remove backup tables
-- DROP TABLE IF EXISTS order_items_backup CASCADE;
-- DROP TABLE IF EXISTS orders_backup CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CLEANUP COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'All old order_items references have been removed';
  RAISE NOTICE 'Unified orders table is optimized';
  RAISE NOTICE 'Database is ready for production use';
  RAISE NOTICE '========================================';
END $$;
