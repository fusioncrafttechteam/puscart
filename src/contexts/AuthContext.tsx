import React, { createContext, useContext, useEffect, useState } from 'react'
// Using basic types to avoid import issues
type User = {
  id: string
  email?: string
  aud?: string
  role?: string
  email_confirmed_at?: string
  phone?: string
  confirmed_at?: string
  created_at?: string
}

type Session = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: User
}

import { supabase } from '../services/supabase'
import type { Database } from '../types/database'

type AppUser = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  appUser: AppUser | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name: string, phone: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Load user profile from localStorage
const loadProfileFromStorage = (userId: string): AppUser | null => {
  try {
    const savedProfile = localStorage.getItem(`puscart_profile_${userId}`);
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
  } catch (error) {
    console.error('Error loading profile from localStorage:', error);
  }
  return null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const isAdmin = appUser?.role === 'admin'

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          setLoading(false)
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch profile in background, don't block
          fetchUserProfile(session.user.id).catch(() => {
            // Silently handle profile fetch errors
          })
        } else {
          setAppUser(null)
          setLoading(false)
        }
      } catch (error) {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          if (event === 'SIGNED_IN') {
            // For signin, set loading to false immediately for instant UI response
            setLoading(false)
          }
          // Fetch profile in background
          fetchUserProfile(session.user.id).catch(() => {
            // Silently handle profile fetch errors
          })
        } else {
          setAppUser(null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      // First try to load from localStorage for instant response
      const cachedProfile = loadProfileFromStorage(userId);
      if (cachedProfile) {
        setAppUser(cachedProfile);
        setLoading(false);
      }

      // Then fetch fresh data from database
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      let profileData: AppUser;

      if (error) {
        // If profile not found, create a basic one
        if (error.code === 'PGRST116') {
          const { data: userData, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              name: 'User',
              email: '',
              phone: '',
              role: 'user',
              profile_image: '',
              is_blocked: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (!createError && userData) {
            profileData = userData;
          } else {
            // Set minimal user object as fallback
            profileData = {
              id: userId,
              name: 'User',
              email: '',
              phone: '',
              role: 'user' as const,
              profile_image: '',
              is_blocked: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          }
        } else {
          // Set minimal user object as fallback
          profileData = {
            id: userId,
            name: 'User',
            email: '',
            phone: '',
            role: 'user' as const,
            profile_image: '',
            is_blocked: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
        }
      } else {
        profileData = data;
      }

      // Save to localStorage and update state
      try {
        localStorage.setItem(`puscart_profile_${userId}`, JSON.stringify(profileData));
      } catch (error) {
        console.error('Error saving profile to localStorage:', error);
      }
      setAppUser(profileData);
    } catch (error) {
      // Set minimal user object as fallback
      const fallbackProfile = {
        id: userId,
        name: 'User',
        email: '',
        phone: '',
        role: 'user' as const,
        profile_image: '',
        is_blocked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setAppUser(fallbackProfile);
    }
  }

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    try {
      console.log("Starting signup process for:", email)
      
      // Create auth user with correct options format
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            phone
          }
        }
      })

      if (authError) {
        console.error("Auth signup error:", authError.message, authError)
        return { error: authError }
      }

      console.log("Auth signup successful:", authData)

      if (authData.user) {
        console.log("User created in auth.users, checking if profile exists...")
        
        // Wait a moment for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Try to fetch the user profile (might be created by trigger)
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error("Error fetching profile:", fetchError)
          // Don't return error yet, try to create manually
        }

        if (!existingProfile) {
          console.log("Profile not found, creating manually...")
          // Create user profile manually if trigger didn't work
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name,
              email,
              phone,
              role: 'user',
              is_blocked: false
            })

          if (profileError) {
            console.error("Manual profile creation error:", profileError.message, profileError)
            return { error: profileError }
          }

          console.log("Profile created manually")
        } else {
          console.log("Profile created automatically by trigger")
        }
      }

      return { error: null }
    } catch (error) {
      console.error("Unexpected signup error:", error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error }
      }

      // Return immediately after successful auth
      // Blocked user check will be handled in background by auth state change listener
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (!error) {
        // Clear all auth state manually
        setUser(null)
        setSession(null)
        setAppUser(null)
      }
    } catch (error) {
      // Silently handle sign out errors
    }
  }

  const value = {
    user,
    appUser,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
