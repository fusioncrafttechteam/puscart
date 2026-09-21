/**
 * API Error Handler
 * Centralized error handling for API calls
 */

import { logger } from '../services/loggingService'

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

/**
 * Classify error type for user-friendly messages
 */
export const classifyError = (error: any): ApiError => {
  // Network errors
  if (!navigator.onLine) {
    return {
      message: 'You are offline. Please check your internet connection and try again.',
      code: 'OFFLINE',
      status: 0
    }
  }

  // Supabase errors
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return {
          message: 'The requested data was not found.',
          code: error.code,
          status: 404
        }
      case '23505':
        return {
          message: 'This record already exists.',
          code: error.code,
          status: 409
        }
      case '23503':
        return {
          message: 'Referenced record does not exist.',
          code: error.code,
          status: 400
        }
      case '42501':
        return {
          message: 'You do not have permission to perform this action.',
          code: error.code,
          status: 403
        }
      case 'JWT expired':
      case 'Invalid JWT':
        return {
          message: 'Your session has expired. Please log in again.',
          code: error.code,
          status: 401
        }
      default:
        return {
          message: error.message || 'An unexpected error occurred.',
          code: error.code,
          status: error.status || 500
        }
    }
  }

  // HTTP status errors
  if (error?.status) {
    switch (error.status) {
      case 400:
        return {
          message: 'Invalid request. Please check your input and try again.',
          code: 'BAD_REQUEST',
          status: 400
        }
      case 401:
        return {
          message: 'You need to log in to perform this action.',
          code: 'UNAUTHORIZED',
          status: 401
        }
      case 403:
        return {
          message: 'You do not have permission to perform this action.',
          code: 'FORBIDDEN',
          status: 403
        }
      case 404:
        return {
          message: 'The requested resource was not found.',
          code: 'NOT_FOUND',
          status: 404
        }
      case 409:
        return {
          message: 'This action conflicts with existing data.',
          code: 'CONFLICT',
          status: 409
        }
      case 429:
        return {
          message: 'Too many requests. Please wait a moment and try again.',
          code: 'RATE_LIMIT',
          status: 429
        }
      case 500:
        return {
          message: 'Server error. Please try again later.',
          code: 'SERVER_ERROR',
          status: 500
        }
      case 503:
        return {
          message: 'Service unavailable. Please try again later.',
          code: 'SERVICE_UNAVAILABLE',
          status: 503
        }
      default:
        return {
          message: error.message || 'An unexpected error occurred.',
          code: 'UNKNOWN',
          status: error.status
        }
    }
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred.',
      code: 'GENERIC',
      status: 500
    }
  }

  // Unknown error
  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN',
    status: 500
  }
}

/**
 * Handle API error with logging and user-friendly message
 */
export const handleApiError = (error: any, context?: string): ApiError => {
  const classifiedError = classifyError(error)

  // Log error for debugging
  logger.error(`API Error${context ? `: ${context}` : ''}`, {
    error: classifiedError,
    originalError: error,
    url: window.location.href
  })

  return classifiedError
}

/**
 * Wrap async functions with error handling
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: ApiError | null }> => {
  try {
    const data = await fn()
    return { data, error: null }
  } catch (error) {
    const apiError = handleApiError(error, context)
    return { data: null, error: apiError }
  }
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: ApiError): string => {
  return error.message
}
