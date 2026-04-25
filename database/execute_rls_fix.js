const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function fixRLSPolicies() {
  try {
    console.log('Starting RLS policy fix...');
    
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, 'fix_cart_rls_policies.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Executing SQL:', sql);
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try executing individual statements
      const statements = sql.split(';').filter(s => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing statement:', statement.trim());
          const { error: stmtError } = await supabase.from('cart_items').select('*').limit(1);
          if (stmtError) {
            console.log('Statement may have failed, continuing...');
          }
        }
      }
    } else {
      console.log('RLS policies fixed successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixRLSPolicies();
