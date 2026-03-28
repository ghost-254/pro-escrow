const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/
const PASSWORD_SYMBOL_REGEX = /[!@#$%^&*(),.?":{}|<>]/

export function normalizeEmail(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

export function normalizePhoneNumber(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export function normalizeVerificationCode(value: unknown) {
  return typeof value === 'string' ? value.replace(/\D/g, '').slice(0, 6) : ''
}

export function validateName(value: string, fieldName: string) {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    return `${fieldName} is required.`
  }

  if (normalizedValue.length > 80) {
    return `${fieldName} must be 80 characters or fewer.`
  }

  return ''
}

export function validateEmailAddress(email: string) {
  if (!email) {
    return 'Email is required.'
  }

  if (!EMAIL_REGEX.test(email)) {
    return 'Invalid email address.'
  }

  return ''
}

export function validatePhoneNumber(phoneNumber: string) {
  if (!phoneNumber) {
    return 'Phone number is required.'
  }

  if (!PHONE_REGEX.test(phoneNumber)) {
    return 'Use a valid phone number.'
  }

  return ''
}

export function validatePasswordStrength(password: string) {
  if (!password) {
    return 'Password is required.'
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least 1 uppercase letter.'
  }

  if (!/\d/.test(password)) {
    return 'Password must contain at least 1 number.'
  }

  if (!PASSWORD_SYMBOL_REGEX.test(password)) {
    return 'Password must contain at least 1 symbol.'
  }

  return ''
}

export function validateVerificationCode(code: string) {
  if (!/^\d{6}$/.test(code)) {
    return 'Enter the 6-digit verification code.'
  }

  return ''
}
