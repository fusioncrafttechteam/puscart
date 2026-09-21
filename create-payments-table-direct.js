// Create payments table using direct SQL execution
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
// Use service role key for admin operations
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZ2tsdmRtdXhubHlkd3djaHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTI0NjY1NSwiZXhwIjoyMDMwODIyNjU1fQ.pFgLz2r9PGXGLBqKhY_6s1kIYpOfU1z6l9I2XJ3M0wQ'

const supabase = createClient(supabaseUrl, serviceKey)

async function createPaymentsTable() {
    try {
        console.log('Creating payments table...')
        
        // First, let's try to create the table using the raw SQL approach
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
            
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
        `
        
        // Try using the SQL editor approach - create a test to see if we can execute SQL
        console.log('You need to manually execute this SQL in Supabase dashboard:')
        console.log('https://supabase.com/dashboard/project/tjgklvdmuxnlydwwchso/sql')
        console.log('\nCopy and paste this SQL:\n')
        console.log(createTableSQL)
        
        // Test if table exists after creation
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .limit(1)
            
        if (error) {
            console.log('Table still doesn\'t exist:', error.message)
        } else {
            console.log('✅ Payments table exists and is accessible!')
        }
        
    } catch (error) {
        console.error('Error:', error)
    }
}

createPaymentsTable()
