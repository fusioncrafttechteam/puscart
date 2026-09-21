# Fix for User Orders Error

## Problem
The frontend is getting a 404 error when trying to call `get_user_orders_with_items` function because it doesn't exist in the database.

## Error Message
```
Could not find the function public.get_user_orders_with_items(user_id) in the schema cache
```

## Solution
Run the SQL script `fix_user_orders_function.sql` in your Supabase dashboard.

## Steps to Fix

### 1. Open Supabase SQL Editor
- Go to: https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/sql
- Login to your Supabase account

### 2. Run the SQL Script
- Copy the contents of `database/fix_user_orders_function.sql`
- Paste it into the SQL editor
- Click "Run" to execute the script

### 3. Verify the Fix
The script will create the missing function and:
- Grant proper permissions to authenticated users
- Return a confirmation message showing the function was created

## What the Function Does
The `get_user_orders_with_items` function:
- Takes a `user_id` parameter
- Returns all orders for that specific user
- Includes order items and product details
- Bypasses Supabase relationship issues
- Orders by creation date (newest first)

## After Running the Script
- Refresh your web application
- The Orders History page should now load properly
- Users will be able to see their order history

## Alternative: Manual Execution
If you prefer, you can run this SQL directly in the editor:

```sql
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

GRANT EXECUTE ON FUNCTION get_user_orders_with_items(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_orders_with_items(UUID) TO service_role;
```
