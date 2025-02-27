'use client'

import React, { useState, JSX } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { auth } from '@/lib/firebaseConfig'
import { sendPasswordResetEmail } from 'firebase/auth'
import { useTheme } from 'next-themes'

export default function PasswordResetPage(): JSX.Element {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { theme } = useTheme()

  // Simple email validation function.
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required.'
    if (!emailRegex.test(email)) return 'Invalid email address.'
    return ''
  }

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const validationError = validateEmail(email)
    setEmailError(validationError)
    if (validationError) return

    setIsLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Please check your inbox.')
      // Optionally, redirect the user after a short delay.
      setTimeout(() => {
        router.push('/auth')
      }, 1500)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error(`Error sending reset email: ${errorMessage}`)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center py-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-200 mb-4">
          Reset Your Password
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-300 mb-6">
          Enter your email address below and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <Input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            disabled={isLoading}
          />
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </form>
      </div>
    </div>
  )
}
