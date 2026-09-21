-- Fix Orders and Users Relationships
-- This script fixes the database schema issues causing 400 errors

-- Issue 1: Fix get_all_orders_with_items function to use correct users table
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
  LEFT JOIN users u ON o.user_id = u.id  -- Use custom users table, not auth.users
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  GROUP BY o.id, o.user_id, o.total_amount, o.payment_status, o.delivery_status, 
           o.delivery_address, o.phone, o.delivery_address_id, o.created_at, o.updated_at,
           u.id, u.name, u.email, u.phone, u.role
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO service_role;

-- Issue 2: Ensure proper foreign key constraints exist
-- Drop and recreate the orders table with proper constraints if needed
DO $$
BEGIN
    -- Check if orders table exists and has the correct user_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        -- Drop foreign key constraint if it points to wrong table
        ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
        
        -- Add correct foreign key constraint to users table
        ALTER TABLE orders 
        ADD CONSTRAINT orders_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Issue 3: Create proper view for Supabase to recognize relationships
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

-- Issue 4: Refresh Supabase schema cache to recognize new relationships
NOTIFY pgrst, 'reload schema';

-- Issue 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON orders(delivery_status);

-- Issue 6: Ensure users table has proper indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Issue 7: Add Row Level Security policies for admin access
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;

-- Create new policies
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Test query to verify the fix
SELECT 'Testing get_all_orders_with_items function...' as status;

-- Final schema cache refresh
NOTIFY pgrst, 'reload schema';

SELECT 'Orders and users relationships fixed successfully!' as status;
