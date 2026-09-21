/**
 * Success Message Component
 * Displays success messages with optional dismiss action
 */

import React from 'react'
import { CheckCircle, X } from 'lucide-react'

interface SuccessMessageProps {
  message: string
  onDismiss?: () => void
  className?: string
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <CheckCircle className="h-5 w-5 text-green-400" />
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-green-800">{message}</p>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              onClick={onDismiss}
              className="text-green-400 hover:text-green-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SuccessMessage
