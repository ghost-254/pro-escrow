export function getErrorDetails(error: unknown, fallbackMessage: string, fallbackStatus = 400) {
  const message = error instanceof Error ? error.message : fallbackMessage
  const status =
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof error.status === 'number'
      ? error.status
      : fallbackStatus

  return { message, status }
}
