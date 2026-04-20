import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { appUser, loading } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !appUser) {
      // Redirect to sign in if not authenticated
      window.location.href = '/signin'
    }
  }, [appUser, loading])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!appUser) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (requireAdmin && appUser.role !== 'admin') {
    // Redirect non-admin users to homepage
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
