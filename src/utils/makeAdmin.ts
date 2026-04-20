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
      console.error('Error finding user:', userError)
      return
    }

    if (!userData) {
      console.error('User not found with email:', email)
      return
    }

    console.log('Found user:', userData)

    // Update user role to admin
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('email', email)
      .select()

    if (updateError) {
      console.error('Error updating user role:', updateError)
      return
    }

    console.log('Successfully updated user to admin:', updateData)
    console.log(`User ${email} is now an admin!`)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Replace with your email address
const YOUR_EMAIL = 'your-email@example.com'

// Run the function
makeUserAdmin(YOUR_EMAIL)

export { makeUserAdmin }
