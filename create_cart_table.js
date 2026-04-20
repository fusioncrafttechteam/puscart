const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for admin operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createCartTable() {
  try {
    console.log('Creating cart_items table...');
    
    // First create the table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS cart_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          product_id UUID REFERENCES products(id) ON DELETE CASCADE,
          quantity INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, product_id)
        );
      `
    });

    if (tableError) {
      console.error('Error creating table:', tableError);
      return;
    }

    console.log('Table created successfully');

    // Create indexes
    const { error: indexError1 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_cart_items_user ON cart_items(user_id);'
    });

    const { error: indexError2 } = await supabase.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_cart_items_product ON cart_items(product_id);'
    });

    if (indexError1 || indexError2) {
      console.error('Error creating indexes:', indexError1 || indexError2);
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;'
    });

    if (rlsError) {
      console.error('Error enabling RLS:', rlsError);
    }

    // Create RLS policies
    const policies = [
      'CREATE POLICY "Users can view own cart items" ON cart_items FOR SELECT USING (auth.uid() = user_id);',
      'CREATE POLICY "Users can create own cart items" ON cart_items FOR INSERT WITH CHECK (auth.uid() = user_id);',
      'CREATE POLICY "Users can update own cart items" ON cart_items FOR UPDATE USING (auth.uid() = user_id);',
      'CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (auth.uid() = user_id);'
    ];

    for (const policy of policies) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policy });
      if (policyError) {
        console.error('Error creating policy:', policyError);
      }
    }

    // Create trigger for updated_at
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TRIGGER update_cart_items_updated_at 
        BEFORE UPDATE ON cart_items 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
    }

    console.log('cart_items table setup completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createCartTable();
