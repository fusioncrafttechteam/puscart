/**
 * Password Strength Validation
 * Provides password strength assessment and validation
 */

export interface PasswordStrengthResult {
  score: number // 0-4
  strength: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: string[]
  isValid: boolean
}

/**
 * Calculate password strength
 */
export const calculatePasswordStrength = (password: string): PasswordStrengthResult => {
  const feedback: string[] = []
  let score = 0

  if (!password || password.length === 0) {
    return {
      score: 0,
      strength: 'weak',
      feedback: ['Password is required'],
      isValid: false
    }
  }

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }

  if (password.length >= 12) {
    score += 1
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters (!@#$%^&*)')
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(Math.floor(score / 1.5), 4)

  let strength: PasswordStrengthResult['strength'] = 'weak'
  if (normalizedScore >= 4) strength = 'very-strong'
  else if (normalizedScore >= 3) strength = 'strong'
  else if (normalizedScore >= 2) strength = 'good'
  else if (normalizedScore >= 1) strength = 'fair'

  // Minimum requirement: at least 6 characters
  const isValid = password.length >= 6

  return {
    score: normalizedScore,
    strength,
    feedback,
    isValid
  }
}

/**
 * Get password strength color for UI
 */
export const getPasswordStrengthColor = (strength: PasswordStrengthResult['strength']): string => {
  switch (strength) {
    case 'weak':
      return '#ef4444' // red
    case 'fair':
      return '#f97316' // orange
    case 'good':
      return '#eab308' // yellow
    case 'strong':
      return '#22c55e' // green
    case 'very-strong':
      return '#16a34a' // dark green
    default:
      return '#ef4444'
  }
}

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength: PasswordStrengthResult['strength']): string => {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'fair':
      return 'Fair'
    case 'good':
      return 'Good'
    case 'strong':
      return 'Strong'
    case 'very-strong':
      return 'Very Strong'
    default:
      return 'Weak'
  }
}
