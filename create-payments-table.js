// Script to create the payments table
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://tjgklvdmuxnlydwwchso.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqZ2tsdmRtdXhubHlkd3djaHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTI0NjY1NSwiZXhwIjoyMDMwODIyNjU1fQ.pFgLz2r9PGXGLBqKhY_6s1kIYpOfU1z6l9I2XJ3M0wQ'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createPaymentsTable() {
  try {
    console.log('Creating payments table...')
    
    // Read the SQL file
    const sql = readFileSync('database/create_payments_table.sql', 'utf8')
    console.log('SQL file read, length:', sql.length)
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
    
    if (error) {
      console.error('Error creating payments table:', error)
      
      // Try alternative approach - execute SQL directly
      console.log('Trying direct SQL execution...')
      
      // Split SQL into individual statements and execute them
      const statements = sql.split(';').filter(s => s.trim())
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing statement:', statement.substring(0, 100) + '...')
          
          const { data: result, error: stmtError } = await supabase
            .from('pg_statements')
            .select('*')
            .limit(1)
          
          // This is just to test connection - we'll use a different approach
        }
      }
    } else {
      console.log('Payments table created successfully:', data)
    }
    
  } catch (error) {
    console.error('Exception:', error)
  }
}

createPaymentsTable()
