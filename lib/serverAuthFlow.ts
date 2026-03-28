export class AuthFlowError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

export function getSafeAuthFlowError(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthFlowError) {
    return {
      status: error.status,
      message: error.message,
    }
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'auth/email-already-exists'
  ) {
    return {
      status: 409,
      message: 'An account with this email already exists. Sign in instead.',
    }
  }

  return {
    status: 500,
    message: fallbackMessage,
  }
}
