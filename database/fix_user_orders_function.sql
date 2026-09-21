-- FIX FOR USER ORDERS ERROR
-- Run this script in Supabase SQL Editor: https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/sql

-- This creates the missing get_user_orders_with_items function that the frontend is trying to call

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
        'email', u.email
      ),
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
            'image', p.image
          )
        )
      ) FILTER (WHERE oi.id IS NOT NULL),
      '[]'::JSONB
    ) as order_items
  FROM orders o
  LEFT JOIN auth.users u ON o.user_id = u.id
  LEFT JOIN order_items oi ON o.id = oi.order_id
  LEFT JOIN products p ON oi.product_id = p.id
  WHERE o.user_id = user_id_param
  GROUP BY o.id, o.user_id, o.total_amount, o.payment_status, o.delivery_status, 
           o.delivery_address, o.phone, o.delivery_address_id, o.created_at, o.updated_at,
           u.id, u.name, u.email
  ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_orders_with_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_orders_with_items(UUID) TO service_role;

-- Verify the function was created
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'get_user_orders_with_items';
