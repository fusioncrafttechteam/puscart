-- ========================================
-- DIAGNOSTIC SCRIPT FOR RLS ISSUE
-- ========================================
-- This script helps diagnose the RLS policy issue
-- Run this to understand the current state before applying the fix

-- Step 1: Check current RLS policies on orders table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'orders' AND schemaname = 'public'
ORDER BY policyname;

-- Step 2: Check if RLS is enabled on orders table
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'orders' AND schemaname = 'public';

-- Step 3: Check orders table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Check foreign key relationship between orders and users
SELECT
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'orders'
  AND tc.table_schema = 'public';

-- Step 5: Check if there are any existing orders
SELECT 
  COUNT(*) as total_orders,
  COUNT(DISTINCT user_id) as unique_users
FROM orders;

-- Step 6: Check for any orders with null user_id
SELECT 
  id,
  user_id,
  total_amount,
  payment_status,
  created_at
FROM orders
WHERE user_id IS NULL
LIMIT 10;

-- Step 7: Verify the trigger that creates public.users from auth.users
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' AND trigger_schema = 'public';

-- Step 8: Check users table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 9: Sample test to verify auth.uid() works
-- This should return the current authenticated user's ID
SELECT auth.uid() as current_auth_uid;

-- Step 10: Check if there are any orders for the current authenticated user
-- This will help verify if the SELECT policy is working
SELECT 
  id,
  user_id,
  total_amount,
  payment_status,
  created_at
FROM orders
WHERE user_id = auth.uid()
LIMIT 5;
