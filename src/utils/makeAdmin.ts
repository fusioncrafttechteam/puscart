import { supabase } from '../services/supabase'

// This script updates a user's role to admin
// Run this once to make yourself an admin
const makeUserAdmin = async (email: string) => {
  try {
    // Get user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', email)
      .single()

    if (userError) {
      return
    }

    if (!userData) {
      return
    }


    // Update user role to admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)

    if (updateError) {
      return
    }

  } catch (error) {
    // Unexpected error
  }
}

// Replace with your email address
const YOUR_EMAIL = 'your-email@example.com'

// Run the function
makeUserAdmin(YOUR_EMAIL)

export { makeUserAdmin }
