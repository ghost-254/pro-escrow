import type { User } from 'firebase/auth'

interface SessionResponse {
  success?: boolean
  error?: string
}

async function parseSessionResponse(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as SessionResponse | null

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error || fallbackMessage)
  }
}

export async function syncServerSession(user: User) {
  const idToken = await user.getIdToken(true)
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  await parseSessionResponse(response, 'Failed to establish a secure session.')
}

export async function clearServerSession() {
  const response = await fetch('/api/auth/session', {
    method: 'DELETE',
  })

  await parseSessionResponse(response, 'Failed to clear the secure session.')
}
