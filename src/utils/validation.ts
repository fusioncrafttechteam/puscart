/**
 * Input Validation Utilities
 * Provides centralized validation functions for user inputs
 * Used across the application to ensure data integrity and security
 */

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = []
  
  if (!email || email.trim() === '') {
    errors.push('Email is required')
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate phone number (Indian format)
 */
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = []
  
  if (!phone || phone.trim() === '') {
    errors.push('Phone number is required')
  } else {
    const phoneRegex = /^[6-9]\d{9}$/
    const cleanPhone = phone.replace(/\s/g, '').replace(/[-+()]/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Invalid phone number. Please enter a valid 10-digit Indian mobile number')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = []
  
  if (!password || password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  if (password && password.length > 128) {
    errors.push('Password must not exceed 128 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate name (letters, spaces, and basic punctuation)
 */
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = []
  
  if (!name || name.trim() === '') {
    errors.push('Name is required')
  } else if (name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  } else if (name.trim().length > 100) {
    errors.push('Name must not exceed 100 characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate address fields
 */
export const validateAddress = (address: string, fieldName: string = 'Address'): ValidationResult => {
  const errors: string[] = []
  
  if (!address || address.trim() === '') {
    errors.push(`${fieldName} is required`)
  } else if (address.trim().length < 10) {
    errors.push(`${fieldName} must be at least 10 characters long`)
  } else if (address.trim().length > 500) {
    errors.push(`${fieldName} must not exceed 500 characters`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate PIN code (Indian format)
 */
export const validatePinCode = (pinCode: string): ValidationResult => {
  const errors: string[] = []
  
  if (!pinCode || pinCode.trim() === '') {
    errors.push('PIN code is required')
  } else {
    const pinCodeRegex = /^\d{6}$/
    if (!pinCodeRegex.test(pinCode.trim())) {
      errors.push('Invalid PIN code. Please enter a valid 6-digit PIN code')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  if (!input) return ''
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}

/**
 * Validate product price
 */
export const validatePrice = (price: number): ValidationResult => {
  const errors: string[] = []
  
  if (isNaN(price)) {
    errors.push('Price must be a valid number')
  } else if (price < 0) {
    errors.push('Price cannot be negative')
  } else if (price > 999999) {
    errors.push('Price must not exceed ₹9,99,999')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate stock quantity
 */
export const validateStock = (stock: number): ValidationResult => {
  const errors: string[] = []
  
  if (isNaN(stock)) {
    errors.push('Stock must be a valid number')
  } else if (stock < 0) {
    errors.push('Stock cannot be negative')
  } else if (!Number.isInteger(stock)) {
    errors.push('Stock must be a whole number')
  } else if (stock > 99999) {
    errors.push('Stock must not exceed 99,999')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate quantity for cart items
 */
export const validateQuantity = (quantity: number): ValidationResult => {
  const errors: string[] = []
  
  if (isNaN(quantity)) {
    errors.push('Quantity must be a valid number')
  } else if (quantity < 1) {
    errors.push('Quantity must be at least 1')
  } else if (!Number.isInteger(quantity)) {
    errors.push('Quantity must be a whole number')
  } else if (quantity > 99) {
    errors.push('Maximum quantity per item is 99')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generic object validation
 */
export const validateObject = (obj: any, requiredFields: string[]): ValidationResult => {
  const errors: string[] = []
  
  if (!obj || typeof obj !== 'object') {
    errors.push('Invalid object')
    return { isValid: false, errors }
  }
  
  requiredFields.forEach(field => {
    if (!(field in obj) || obj[field] === undefined || obj[field] === null || obj[field] === '') {
      errors.push(`${field} is required`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
