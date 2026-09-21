/**
 * Error Message Component
 * Displays user-friendly error messages with optional retry action
 */

import React from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  onRetry?: () => void
  showRetry?: boolean
  className?: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  onRetry,
  showRetry = false,
  className = ''
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <AlertCircle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-800">{message}</p>
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          )}
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ErrorMessage
