-- Fix Users with Orders Count Relationship
-- This script creates a function to get users with their orders count

-- Create function to get users with orders count
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_with_orders_count TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_orders_count TO service_role;

-- Alternative: Create a view for users with orders count
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Refresh Supabase schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Users with orders count function created successfully!' as status;
