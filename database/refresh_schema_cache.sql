-- Refresh Supabase PostgREST schema cache to recognize the updated function
-- Run this in Supabase SQL Editor after fixing the parameter mismatch

NOTIFY pgrst, 'reload schema';

-- Verify the function exists with correct parameter name
SELECT 
  proname as function_name,
  proargnames as parameter_names,
  proargtypes as parameter_types
FROM pg_proc 
WHERE proname = 'get_user_orders_with_items';

-- Test the function with a sample user ID (replace with actual user ID from your database)
-- SELECT * FROM get_user_orders_with_items('YOUR_USER_ID_HERE'::UUID) LIMIT 1;
