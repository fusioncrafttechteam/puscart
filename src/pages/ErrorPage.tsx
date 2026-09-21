/**
 * Generic Error Page
 * Used for displaying errors to users in a user-friendly way
 */

import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

interface ErrorPageProps {
  title?: string
  message?: string
  showRetry?: boolean
  showHome?: boolean
  errorId?: string
}

const ErrorPage: React.FC<ErrorPageProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again or contact support if the problem persists.',
  showRetry = true,
  showHome = true,
  errorId
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
          {title}
        </h1>

        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {errorId && (
          <div className="bg-gray-100 rounded-md p-3 mb-6">
            <p className="text-xs text-gray-500 text-center">
              Error ID: <span className="font-mono">{errorId}</span>
            </p>
          </div>
        )}

        <div className="space-y-3">
          {showRetry && (
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {showHome && (
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              <Home className="w-4 h-4" />
              Go to Homepage
            </Link>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact us at{' '}
            <a href="mailto:puscartdeliveryservice@gmail.com" className="text-blue-600 hover:underline">
              puscartdeliveryservice@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
