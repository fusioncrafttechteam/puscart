-- Add policy to allow admins to view all users
-- This fixes the issue where admin users page only shows the current user

-- Create a SECURITY DEFINER function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

-- Policy for regular users to view their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Policy for admins to view all users (using the SECURITY DEFINER function)
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (public.is_admin());

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Policy for admins to update all users (using the SECURITY DEFINER function)
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (public.is_admin());

-- Policy for users to insert their own profile (handled by trigger)
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
