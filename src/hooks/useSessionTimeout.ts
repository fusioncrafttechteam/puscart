/**
 * Session Timeout Hook
 * Automatically logs out users after inactivity
 */

import { useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SessionTimeoutOptions {
  timeoutMinutes?: number // Default: 30 minutes
  warningMinutes?: number // Default: 5 minutes before timeout
  onWarning?: (remainingMinutes: number) => void
  onTimeout?: () => void
}

export const useSessionTimeout = (options: SessionTimeoutOptions = {}) => {
  const { signOut } = useAuth()
  const {
    timeoutMinutes = 30,
    warningMinutes = 5,
    onWarning,
    onTimeout
  } = options

  const timeoutRef = useRef<number | null>(null)
  const warningRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const warningShownRef = useRef(false)

  /**
   * Reset the timeout timers
   */
  const resetTimeout = useCallback(() => {
    const now = Date.now()
    lastActivityRef.current = now
    warningShownRef.current = false

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Set warning timer
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000
    warningRef.current = setTimeout(() => {
      if (!warningShownRef.current) {
        warningShownRef.current = true
        onWarning?.(warningMinutes)
      }
    }, warningTime)

    // Set timeout timer
    const timeoutTime = timeoutMinutes * 60 * 1000
    timeoutRef.current = setTimeout(() => {
      handleTimeout()
    }, timeoutTime)
  }, [timeoutMinutes, warningMinutes, onWarning, onTimeout])

  /**
   * Handle session timeout
   */
  const handleTimeout = useCallback(async () => {
    // Clear timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
    }

    // Call custom timeout handler if provided
    if (onTimeout) {
      onTimeout()
    } else {
      // Default: sign out user
      await signOut()
    }
  }, [signOut, onTimeout])

  /**
   * Handle user activity
   */
  const handleActivity = useCallback(() => {
    resetTimeout()
  }, [resetTimeout])

  useEffect(() => {
    // Set up activity event listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ]

    events.forEach(event => {
      window.addEventListener(event, handleActivity)
    })

    // Initialize timeout
    resetTimeout()

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current)
      }
    }
  }, [handleActivity, resetTimeout])

  /**
   * Manually reset the timeout
   */
  const manualReset = useCallback(() => {
    resetTimeout()
  }, [resetTimeout])

  /**
   * Get remaining time until timeout (in minutes)
   */
  const getRemainingTime = useCallback((): number => {
    const now = Date.now()
    const elapsed = now - lastActivityRef.current
    const remaining = (timeoutMinutes * 60 * 1000) - elapsed
    return Math.max(0, Math.ceil(remaining / 60 / 1000))
  }, [timeoutMinutes])

  return {
    manualReset,
    getRemainingTime
  }
}
