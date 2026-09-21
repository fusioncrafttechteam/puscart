-- Test and fix orders function
-- This script will test the current state and fix any issues

-- First, let's see what tables exist and their structure
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('orders', 'users', 'order_items', 'products');

-- Check if the function exists
SELECT routine_name FROM information_schema.routines WHERE routine_name = 'get_all_orders_with_items';

-- Drop and recreate the function with proper JSONB casting
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
  LEFT JOIN users u ON o.user_id = u.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  GROUP BY o.id, o.user_id, o.total_amount, o.payment_status, o.delivery_status, 
           o.delivery_address, o.phone, o.delivery_address_id, o.created_at, o.updated_at,
           u.id, u.name, u.email, u.phone, u.role
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_orders_with_items TO service_role;

-- Test the function
SELECT * FROM get_all_orders_with_items() LIMIT 5;

-- Check for any sample data
SELECT COUNT(*) as order_count FROM orders;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as item_count FROM order_items;
SELECT COUNT(*) as product_count FROM products;
