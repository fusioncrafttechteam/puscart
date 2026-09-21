-- Create admin_audit_logs table for security and compliance
-- This table tracks all admin actions for audit purposes

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_name TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('product', 'category', 'order', 'user', 'banner', 'settings', 'other')),
  entity_id UUID,
  entity_name TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity_type ON admin_audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);

-- Enable Row Level Security
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON admin_audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Policy: No one can delete audit logs (immutable records)
CREATE POLICY "No one can delete audit logs"
ON admin_audit_logs FOR DELETE
TO authenticated
USING (false);

-- Policy: No one can update audit logs (immutable records)
CREATE POLICY "No one can update audit logs"
ON admin_audit_logs FOR UPDATE
TO authenticated
USING (false);

-- Comment
COMMENT ON TABLE admin_audit_logs IS 'Audit log for all admin actions for security and compliance';
