/**
 * Health Check Utilities
 * Production readiness and environment validation
 */

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    name: string
    status: 'pass' | 'fail' | 'warn'
    message?: string
    duration?: number
  }[]
  timestamp: string
}

export interface EnvironmentConfig {
  supabaseUrl: boolean
  supabaseAnonKey: boolean
  razorpayKeyId: boolean
  emailjsConfig: boolean
  nodeEnv: string
}

/**
 * Check environment variables
 */
export const checkEnvironmentConfig = (): EnvironmentConfig => {
  return {
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    razorpayKeyId: !!import.meta.env.VITE_RAZORPAY_KEY_ID,
    emailjsConfig: !!(
      import.meta.env.VITE_EMAILJS_SERVICE_ID &&
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID &&
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    ),
    nodeEnv: import.meta.env.MODE || 'development'
  }
}

/**
 * Validate environment configuration
 */
export const validateEnvironment = (): { valid: boolean; errors: string[] } => {
  const config = checkEnvironmentConfig()
  const errors: string[] = []

  if (!config.supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is not configured')
  }

  if (!config.supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not configured')
  }

  if (!config.razorpayKeyId) {
    errors.push('VITE_RAZORPAY_KEY_ID is not configured')
  }

  if (config.nodeEnv === 'production' && !config.emailjsConfig) {
    errors.push('EmailJS configuration is missing in production')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Check Supabase connection
 */
export const checkSupabaseConnection = async (): Promise<{ status: 'pass' | 'fail'; message: string; duration: number }> => {
  const startTime = performance.now()
  
  try {
    const { supabase } = await import('../services/supabase')
    
    // Simple health check query
    const { error } = await supabase
      .from('products')
      .select('id')
      .limit(1)

    const duration = performance.now() - startTime

    if (error) {
      return {
        status: 'fail',
        message: `Supabase connection failed: ${error.message}`,
        duration
      }
    }

    return {
      status: 'pass',
      message: 'Supabase connection successful',
      duration
    }
  } catch (error) {
    const duration = performance.now() - startTime
    return {
      status: 'fail',
      message: `Supabase check error: ${String(error)}`,
      duration
    }
  }
}

/**
 * Check browser compatibility
 */
export const checkBrowserCompatibility = (): { status: 'pass' | 'fail' | 'warn'; message: string } => {
  const checks = {
    localStorage: typeof Storage !== 'undefined',
    sessionStorage: typeof Storage !== 'undefined',
    fetch: typeof fetch !== 'undefined',
    promise: typeof Promise !== 'undefined',
    es6: typeof Map !== 'undefined' && typeof Set !== 'undefined'
  }

  const failedChecks = Object.entries(checks)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature)

  if (failedChecks.length === 0) {
    return { status: 'pass', message: 'All browser features supported' }
  }

  if (failedChecks.length <= 2) {
    return { 
      status: 'warn', 
      message: `Some features may not work: ${failedChecks.join(', ')}` 
    }
  }

  return { 
    status: 'fail', 
    message: `Browser not compatible: ${failedChecks.join(', ')}` 
  }
}

/**
 * Run comprehensive health check
 */
export const runHealthCheck = async (): Promise<HealthCheckResult> => {
  const checks: HealthCheckResult['checks'] = []
  const timestamp = new Date().toISOString()

  // Environment check
  const envConfig = checkEnvironmentConfig()
  const envErrors = Object.entries(envConfig)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  checks.push({
    name: 'Environment Configuration',
    status: envErrors.length === 0 ? 'pass' : 'fail',
    message: envErrors.length > 0 ? `Missing: ${envErrors.join(', ')}` : 'All required variables configured'
  })

  // Browser compatibility
  const browserCheck = checkBrowserCompatibility()
  checks.push({
    name: 'Browser Compatibility',
    status: browserCheck.status,
    message: browserCheck.message
  })

  // Supabase connection
  const supabaseCheck = await checkSupabaseConnection()
  checks.push({
    name: 'Supabase Connection',
    status: supabaseCheck.status,
    message: supabaseCheck.message,
    duration: supabaseCheck.duration
  })

  // Determine overall status
  const failedChecks = checks.filter(c => c.status === 'fail')
  const warnChecks = checks.filter(c => c.status === 'warn')

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  if (failedChecks.length > 0) {
    overallStatus = 'unhealthy'
  } else if (warnChecks.length > 0) {
    overallStatus = 'degraded'
  }

  return {
    status: overallStatus,
    checks,
    timestamp
  }
}

/**
 * Get production readiness report
 */
export const getProductionReadinessReport = async (): Promise<{
  ready: boolean
  checks: HealthCheckResult
  recommendations: string[]
}> => {
  const healthCheck = await runHealthCheck()
  const recommendations: string[] = []

  // Analyze health check results
  healthCheck.checks.forEach(check => {
    if (check.status === 'fail') {
      recommendations.push(`Fix: ${check.name} - ${check.message}`)
    } else if (check.status === 'warn') {
      recommendations.push(`Review: ${check.name} - ${check.message}`)
    }
  })

  // Add general recommendations
  const envConfig = checkEnvironmentConfig()
  if (envConfig.nodeEnv === 'production') {
    recommendations.push('Ensure all environment variables are set for production')
    recommendations.push('Verify SSL/TLS certificates are configured')
    recommendations.push('Enable CDN for static assets')
    recommendations.push('Configure error monitoring service (e.g., Sentry)')
    recommendations.push('Set up analytics tracking')
  }

  const ready = healthCheck.status === 'healthy' && recommendations.length === 0

  return {
    ready,
    checks: healthCheck,
    recommendations
  }
}
