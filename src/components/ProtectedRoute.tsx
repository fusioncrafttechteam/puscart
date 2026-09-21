import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { appUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"
          aria-hidden="true"
        />
        <span className="sr-only">Checking access</span>
      </div>
    )
  }

  if (!appUser) {
    return <Navigate to="/signin" replace state={{ from: location }} />
  }

  if (requireAdmin && appUser.role !== 'admin') {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
