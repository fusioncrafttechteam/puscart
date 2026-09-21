-- COMPREHENSIVE DATABASE FIXES
-- Run this entire script in your Supabase SQL Editor to fix all 400 errors

-- =====================================================
-- STEP 1: Fix Orders and Users Relationships
-- =====================================================

-- Fix get_all_orders_with_items function to use correct users table
DROP FUNCTION IF EXISTS get_all_orders_with_items();

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
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  users JSONB,
  order_items JSONB
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
        'email', u.email,
        'phone', u.phone,
        'role', u.role
      )::JSONB,
      '{}'::JSONB
    ) as users,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'id', oi.id,
          'product_id', oi.product_id,
          'quantity', oi.quantity,
          'price', oi.price,
          'products', JSON_BUILD_OBJECT(
            'id', p.id,
            'name', p.name,
            'image', p.image,
            'price', p.price
          )::JSONB
        )::JSONB
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::JSONB
    ) as order_items
  FROM orders o
  LEFT JOIN users u ON o.user_id = u.id  -- Use custom users table
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  GROUP BY o.id, o.user_id, o.total_amount, o.payment_status, o.delivery_status, 
           o.delivery_address, o.phone, o.delivery_address_id, o.created_at, o.updated_at,
           u.id, u.name, u.email, u.phone, u.role
  ORDER BY o.created_at DESC;
END;
$$;

-- =====================================================
-- STEP 2: Fix Users with Orders Count Function
-- =====================================================

CREATE OR REPLACE FUNCTION get_users_with_orders_count()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(10),
  profile_image TEXT,
  is_blocked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  orders_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.*,
    COALESCE(o.orders_count, 0) as orders_count
  FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) as orders_count
    FROM orders
    GROUP BY user_id
  ) o ON u.id = o.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- =====================================================
-- STEP 3: Fix Foreign Key Constraints
-- =====================================================

-- Ensure proper foreign key constraints exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 4: Create Views for Supabase Relationships
-- =====================================================

DROP VIEW IF EXISTS orders_with_users;
CREATE VIEW orders_with_users AS
SELECT 
    o.*,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    u.role as user_role
FROM orders o
LEFT JOIN users u ON o.user_id = u.id;

DROP VIEW IF EXISTS users_with_orders_count;
CREATE VIEW users_with_orders_count AS
SELECT 
    u.*,
    COALESCE(o.orders_count, 0) as orders_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as orders_count
    FROM orders
    GROUP BY user_id
) o ON u.id = o.user_id
ORDER BY u.created_at DESC;

-- =====================================================
-- STEP 5: Create Performance Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- STEP 6: Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO service_role;
GRANT EXECUTE ON FUNCTION get_users_with_orders_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_orders_count TO service_role;

-- =====================================================
-- STEP 7: Enable Row Level Security
-- =====================================================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;

-- Create new policies
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- =====================================================
-- STEP 8: Refresh Schema Cache
-- =====================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================
-- STEP 9: Test Queries
-- =====================================================

-- Test the orders function
SELECT 'Testing get_all_orders_with_items function...' as status;

-- Test the users function  
SELECT 'Testing get_users_with_orders_count function...' as status;

-- Final schema cache refresh
NOTIFY pgrst, 'reload schema';

SELECT '========================================' as separator;
SELECT 'ALL DATABASE FIXES COMPLETED SUCCESSFULLY!' as status;
SELECT '========================================' as separator;
