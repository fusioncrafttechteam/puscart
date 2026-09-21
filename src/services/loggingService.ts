/**
 * Logging Service
 * Centralized logging for errors, warnings, and admin actions
 */

export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
} as const

export type LogLevel = typeof LogLevel[keyof typeof LogLevel]

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  userAgent?: string
  url?: string
}

class LoggingService {
  private isDevelopment = import.meta.env.DEV
  private maxLogEntries = 1000
  private storageKey = 'puscart_logs'

  /**
   * Log a message with specified level
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.getCurrentUserId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = level === LogLevel.ERROR || level === LogLevel.CRITICAL
        ? console.error
        : level === LogLevel.WARNING
        ? console.warn
        : console.log

      consoleMethod(`[${level}] ${message}`, context || '')
    }

    // Store in localStorage for debugging
    this.storeLog(entry)

    // In production, you would send this to a logging service
    // e.g., Sentry, LogRocket, or custom backend endpoint
    if (!this.isDevelopment && (level === LogLevel.ERROR || level === LogLevel.CRITICAL)) {
      this.sendToRemoteLogging(entry)
    }
  }

  /**
   * Get current user ID from localStorage
   */
  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('sb-puscart-auth-token')
      if (authData) {
        const parsed = JSON.parse(authData)
        return parsed.user?.id
      }
    } catch (error) {
      // Silently handle error
    }
    return undefined
  }

  /**
   * Store log entry in localStorage
   */
  private storeLog(entry: LogEntry) {
    try {
      const logs = this.getLogs()
      logs.push(entry)

      // Keep only the most recent entries
      if (logs.length > this.maxLogEntries) {
        logs.splice(0, logs.length - this.maxLogEntries)
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs))
    } catch (error) {
      // If localStorage is full, clear old logs
      try {
        localStorage.removeItem(this.storageKey)
      } catch (e) {
        // Silently handle error
      }
    }
  }

  /**
   * Get all stored logs
   */
  getLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem(this.storageKey)
      return logs ? JSON.parse(logs) : []
    } catch (error) {
      return []
    }
  }

  /**
   * Clear all stored logs
   */
  clearLogs() {
    try {
      localStorage.removeItem(this.storageKey)
    } catch (error) {
      // Silently handle error
    }
  }

  /**
   * Send log to remote logging service (placeholder)
   * In production, integrate with Sentry, LogRocket, or custom endpoint
   */
  private async sendToRemoteLogging(entry: LogEntry) {
    try {
      // Placeholder for remote logging integration
      // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
      
      // For now, just store locally
      console.log('Remote logging not configured:', entry)
    } catch (error) {
      // Silently handle remote logging errors
    }
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * Log warning message
   */
  warning(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARNING, message, context)
  }

  /**
   * Log error message
   */
  error(message: string, context?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context)
  }

  /**
   * Log critical message
   */
  critical(message: string, context?: Record<string, any>) {
    this.log(LogLevel.CRITICAL, message, context)
  }

  /**
   * Log admin action
   */
  logAdminAction(action: string, details?: Record<string, any>) {
    this.info(`Admin Action: ${action}`, {
      action,
      ...details,
      isAdmin: true
    })
  }

  /**
   * Log user action
   */
  logUserAction(action: string, details?: Record<string, any>) {
    this.debug(`User Action: ${action}`, {
      action,
      ...details
    })
  }

  /**
   * Log API call
   */
  logApiCall(endpoint: string, method: string, details?: Record<string, any>) {
    this.debug(`API Call: ${method} ${endpoint}`, {
      endpoint,
      method,
      ...details
    })
  }

  /**
   * Log API error
   */
  logApiError(endpoint: string, method: string, error: any, details?: Record<string, any>) {
    this.error(`API Error: ${method} ${endpoint}`, {
      endpoint,
      method,
      error: error?.message || String(error),
      ...details
    })
  }
}

// Export singleton instance
export const logger = new LoggingService()
