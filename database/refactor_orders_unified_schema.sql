-- ========================================
-- UNIFIED ORDERS TABLE REFACTOR MIGRATION
-- ========================================
-- This migration consolidates orders and order_items into a single unified table
-- while preserving all existing data and functionality

-- Step 1: Create backup of existing data
CREATE TABLE IF NOT EXISTS orders_backup AS 
SELECT * FROM orders;

DO $$
BEGIN
  -- Only create order_items_backup if the table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
    CREATE TABLE IF NOT EXISTS order_items_backup AS 
    SELECT * FROM order_items;
  END IF;
END $$;

-- Step 2: Create the new unified orders table structure
-- Drop existing orders table cascade to remove dependencies
DROP TABLE IF EXISTS orders CASCADE;

-- Create new unified orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Order metadata (from original orders table)
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  delivery_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
  
  -- Unified products storage (replaces order_items table)
  products JSONB NOT NULL DEFAULT '[]'::JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Migrate data from old structure to new unified structure
INSERT INTO orders (
  id, user_id, total_amount, payment_status, delivery_status, 
  delivery_address, phone, delivery_address_id, products, created_at, updated_at
)
SELECT 
  o.id,
  o.user_id,
  o.total_amount,
  o.payment_status,
  o.delivery_status,
  o.delivery_address,
  o.phone,
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_addresses ua WHERE ua.id = o.delivery_address_id) 
    THEN o.delivery_address_id 
    ELSE NULL 
  END,
  
  -- Convert order_items to JSON array format
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', oi.id,
        'product_id', oi.product_id,
        'quantity', oi.quantity,
        'price', oi.price,
        'created_at', oi.created_at,
        'products', (
          SELECT JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'image', p.image
          )
          FROM products p 
          WHERE p.id = oi.product_id
        )
      )
    ) FILTER (WHERE oi.id IS NOT NULL),
    '[]'::json
  )::jsonb as products,
  
  o.created_at,
  o.updated_at
FROM orders_backup o
LEFT JOIN order_items_backup oi ON o.id = oi.order_id
GROUP BY o.id, o.user_id, o.total_amount, o.payment_status, o.delivery_status, 
         o.delivery_address, o.phone, o.delivery_address_id, o.created_at, o.updated_at;

-- Step 4: Create indexes for the new unified table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_products_gin ON orders USING GIN(products);

-- Step 5: Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for the new unified table
-- Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

-- Step 7: Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Drop existing functions and create new SQL functions for the unified table structure

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_user_orders_with_items(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_all_orders_with_items() CASCADE;

-- Function for users to get their orders with items
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

-- Function for admin to get all orders with user details
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

-- Step 9: Grant execute permissions to functions
GRANT EXECUTE ON FUNCTION get_user_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO service_role;

-- Step 10: Drop the old order_items table (data is now in unified orders table)
DROP TABLE IF EXISTS order_items CASCADE;

-- Step 11: Clean up backup tables (comment out if you want to keep backups)
-- DROP TABLE IF EXISTS orders_backup;
-- DROP TABLE IF EXISTS order_items_backup;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Orders table refactor completed successfully!';
  RAISE NOTICE 'Old order_items table has been dropped.';
  RAISE NOTICE 'All data has been migrated to the unified orders table.';
  RAISE NOTICE 'Backup tables are available if needed: orders_backup, order_items_backup';
END $$;
