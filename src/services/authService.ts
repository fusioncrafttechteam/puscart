import { supabase } from './supabase';

/**
 * Enhanced authentication service to handle session management
 */
export class AuthService {
  /**
   * Get a valid authentication token for Edge Functions
   */
  static async getValidAuthToken(): Promise<string> {
    try {
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error('Failed to get authentication session');
      }
      
      if (!sessionData.session) {
        throw new Error('No active session. Please login again.');
      }
      
      const { session } = sessionData;
      const authToken = session.access_token;
      
      if (!authToken) {
        throw new Error('No authentication token available');
      }
      
      // Check if token is expired
      if (session.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = session.expires_at - now;
        
        // Token expiry check
      
        // If token is expired or will expire within 5 minutes, refresh it
        if (timeUntilExpiry <= 300) { // 5 minutes buffer
          return await this.refreshAuthToken();
        }
      }
      
      return authToken;
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Refresh the authentication token
   */
  static async refreshAuthToken(): Promise<string> {
    try {
      
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        throw new Error('Failed to refresh authentication token');
      }
      
      if (!refreshData.session?.access_token) {
        throw new Error('No authentication token after refresh');
      }
      
      const newToken = refreshData.session.access_token;
      
      return newToken;
      
    } catch (error) {
      throw new Error('Session expired. Please login again.');
    }
  }
  
  /**
   * Validate current authentication state
   */
  static async validateAuthState(): Promise<boolean> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        return false;
      }
      
      const { session } = sessionData;
      
      // Check if token is still valid
      if (session.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        return session.expires_at > now;
      }
      
      return true;
      
    } catch (error) {
      return false;
    }
  }
}
