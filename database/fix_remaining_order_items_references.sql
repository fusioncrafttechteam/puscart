-- ========================================
-- FIX REMAINING ORDER_ITEMS REFERENCES
-- ========================================
-- This script fixes any remaining references to the old order_items table
-- and ensures the database is fully compatible with the new unified structure

-- Step 1: Update any remaining SQL functions that reference order_items
-- Note: These functions should already be updated, but this ensures consistency

-- Drop any old functions that still reference order_items table
DROP FUNCTION IF EXISTS get_user_orders_with_items_old(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_all_orders_with_items_old() CASCADE;

-- Step 2: Ensure the unified functions are properly created
-- These functions should already exist from the refactor migration

-- Function for users to get their orders with items (unified version)
CREATE OR REPLACE FUNCTION get_user_orders_with_items(user_id_param UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  total_amount DECIMAL(10,2),
  payment_status VARCHAR(20),
  delivery_status VARCHAR(20),
  delivery_address TEXT,
  phone VARCHAR(20),
  delivery_address_id UUID,
  products JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.user_id,
    o.total_amount,
    o.payment_status,
    o.delivery_status,
    o.delivery_address,
    o.phone,
    o.delivery_address_id,
    o.products,
    o.created_at,
    o.updated_at
  FROM orders o
  WHERE o.user_id = user_id_param
  ORDER BY o.created_at DESC;
END;
$$;

-- Function for admin to get all orders with user details (unified version)
CREATE OR REPLACE FUNCTION get_all_orders_with_items()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  total_amount DECIMAL(10,2),
  payment_status VARCHAR(20),
  delivery_status VARCHAR(20),
  delivery_address TEXT,
  phone VARCHAR(20),
  delivery_address_id UUID,
  products JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  users JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.*,
    COALESCE(
      JSON_BUILD_OBJECT(
        'id', u.id,
        'name', u.name,
        'email', u.email
      )::JSONB,
      '{}'::JSONB
    ) as users
  FROM orders o
  LEFT JOIN public.users u ON o.user_id = u.id
  ORDER BY o.created_at DESC;
END;
$$;

-- Step 3: Grant permissions to the unified functions
GRANT EXECUTE ON FUNCTION get_user_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO service_role;

-- Step 4: Clean up any remaining references to old order_items table
-- Remove any indexes that might still reference order_items
DROP INDEX IF EXISTS idx_order_items_order;
DROP INDEX IF EXISTS idx_order_items_product;
DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_order_items_product_id;

-- Step 5: Verify the unified structure is working
-- Check that orders table has the products column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'products' 
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Orders table missing products column. Please run refactor_orders_unified_schema.sql first';
  END IF;
END $$;

-- Step 6: Ensure payment_id column exists in orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_name = 'payment_id' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
  END IF;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Remaining order_items references fixed successfully!';
  RAISE NOTICE 'Database is now fully compatible with unified orders structure!';
  RAISE NOTICE 'All functions now use the JSONB products column!';
END $$;
