/**
 * API Rate Limiting Hook
 * Prevents excessive API calls and implements rate limiting
 */

import { useCallback, useRef } from 'react'

interface RateLimitOptions {
  maxCalls?: number // Maximum number of calls allowed
  windowMs?: number // Time window in milliseconds
}

interface RateLimitResult {
  canMakeCall: boolean
  resetTime: number
  remainingCalls: number
}

/**
 * Custom hook for rate limiting function calls
 */
export const useRateLimit = (options: RateLimitOptions = {}) => {
  const {
    maxCalls = 5,
    windowMs = 60000 // Default: 5 calls per minute
  } = options

  const callHistory = useRef<number[]>([])

  const checkRateLimit = useCallback((): RateLimitResult => {
    const now = Date.now()
    
    // Remove calls outside the time window
    callHistory.current = callHistory.current.filter(
      timestamp => now - timestamp < windowMs
    )

    const remainingCalls = maxCalls - callHistory.current.length
    const canMakeCall = remainingCalls > 0

    // Calculate reset time (when oldest call will expire)
    const resetTime = callHistory.current.length > 0
      ? callHistory.current[0] + windowMs
      : now

    return {
      canMakeCall,
      resetTime,
      remainingCalls
    }
  }, [maxCalls, windowMs])

  const recordCall = useCallback(() => {
    callHistory.current.push(Date.now())
  }, [])

  const reset = useCallback(() => {
    callHistory.current = []
  }, [])

  return {
    checkRateLimit,
    recordCall,
    reset
  }
}

/**
 * Higher-order function to wrap async functions with rate limiting
 */
export const withRateLimit = async <T extends (...args: any[]) => any>(
  fn: T,
  options: RateLimitOptions = {}
): Promise<ReturnType<T>> => {
  const {
    maxCalls = 5,
    windowMs = 60000
  } = options

  const storageKey = `ratelimit_${fn.name || 'anonymous'}`
  const now = Date.now()

  try {
    const history = JSON.parse(localStorage.getItem(storageKey) || '[]') as number[]
    
    // Remove calls outside the time window
    const validCalls = history.filter((timestamp: number) => now - timestamp < windowMs)

    if (validCalls.length >= maxCalls) {
      const oldestCall = validCalls[0]
      const waitTime = oldestCall + windowMs - now
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`)
    }

    // Record this call
    validCalls.push(now)
    localStorage.setItem(storageKey, JSON.stringify(validCalls))

    // Execute the function
    return await fn()
  } catch (error) {
    if (error instanceof Error && error.message.includes('Rate limit exceeded')) {
      throw error
    }
    throw error
  }
}
