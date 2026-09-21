/**
 * Debounce Hook
 * Delays function execution until after a specified delay
 */

import { useCallback, useEffect, useRef } from 'react'

export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<number | undefined>(undefined)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== undefined) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback as T
}
