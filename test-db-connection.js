// Test database connection and check if payments table exists
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZ2tsdmRtdXhubHlkd3djaHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTI0NjY1NSwiZXhwIjoyMDMwODIyNjU1fQ.pFgLz2r9PGXGLBqKhY_6s1kIYpOfU1z6l9I2XJ3M0wQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDatabase() {
  try {
    console.log('Testing database connection...')
    
    // Test 1: Check if payments table exists
    console.log('Checking if payments table exists...')
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1)
    
    console.log('Payments table check:', { paymentsData, paymentsError })
    
    if (paymentsError) {
      console.log('Payments table does not exist, creating it...')
      
      // Create the payments table manually
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
          razorpay_payment_id VARCHAR(255) UNIQUE,
          amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
          currency VARCHAR(3) DEFAULT 'INR',
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled')),
          payment_method VARCHAR(50) DEFAULT 'razorpay',
          order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
          razorpay_signature TEXT,
          failure_reason TEXT,
          metadata JSONB DEFAULT '{}'::JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
        CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
        CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
        CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
        
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY IF NOT EXISTS "Admins can view all payments" ON payments FOR SELECT USING (EXISTS (
          SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
        ));
        CREATE POLICY IF NOT EXISTS "Admins can update all payments" ON payments FOR UPDATE USING (EXISTS (
          SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
        ));
      `
      
      // Try to execute the SQL using raw SQL execution
      const { data: execData, error: execError } = await supabase
        .rpc('exec', { sql: createTableSQL })
      
      console.log('Table creation result:', { execData, execError })
      
      if (execError) {
        console.log('RPC exec failed, trying alternative approach...')
        
        // Try using the PostgreSQL client directly
        console.log('You need to manually create the payments table. Please go to:')
        console.log('https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/sql')
        console.log('And execute the SQL from database/create_payments_table.sql')
      }
    } else {
      console.log('✅ Payments table already exists!')
    }
    
    // Test 2: Check if we can insert a test record
    console.log('Testing insert...')
    const { data: insertData, error: insertError } = await supabase
      .from('payments')
      .insert({
        razorpay_order_id: 'test_order_' + Date.now(),
        user_id: '00000000-0000-0000-0000-000000000000',
        amount: 100,
        currency: 'INR',
        status: 'pending'
      })
      .select()
    
    console.log('Insert test:', { insertData, insertError })
    
  } catch (error) {
    console.error('Database test error:', error)
  }
}

testDatabase()
