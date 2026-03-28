'use client'

import React, { FormEvent, JSX, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import Checkbox from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Typography from '@/components/ui/typography'
import {
  normalizeEmail,
  normalizePhoneNumber,
  normalizeVerificationCode,
  validateEmailAddress,
  validateName,
  validatePasswordStrength,
  validatePhoneNumber,
  validateVerificationCode,
} from '@/lib/authValidation'
import { syncServerSession } from '@/lib/clientAuthSession'
import { getTimeOfDay } from '@/lib/dateTime'
import { auth } from '@/lib/firebaseConfig'
import { cn } from '@/lib/utils'

type AuthResponse = {
  success?: boolean
  error?: string
  message?: string
  email?: string
  requiresVerification?: boolean
}

function getFirebaseSignInErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Invalid email or password.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait and try again.'
      case 'auth/network-request-failed':
        return 'Network error. Check your connection and try again.'
      default:
        break
    }
  }

  return error instanceof Error ? error.message : 'We could not sign you in right now.'
}

async function postAuthJson(
  url: string,
  payload: Record<string, string>,
  fallbackMessage: string
) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = (await response.json().catch(() => null)) as AuthResponse | null

  if (!response.ok || !data?.success) {
    throw new Error(data?.error || fallbackMessage)
  }

  return data
}

export default function AuthPage(): JSX.Element {
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [isLoading, setIsLoading] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState('')

  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInEmailError, setSignInEmailError] = useState('')
  const [signInPasswordError, setSignInPasswordError] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [isEightChars, setIsEightChars] = useState(false)
  const [hasUpperCase, setHasUpperCase] = useState(false)
  const [hasNumber, setHasNumber] = useState(false)
  const [hasSymbol, setHasSymbol] = useState(false)

  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [phoneNumberError, setPhoneNumberError] = useState('')
  const [signUpEmailError, setSignUpEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmCheck, setConfirmCheck] = useState(false)

  const [verificationEmail, setVerificationEmail] = useState('')
  const [verificationPassword, setVerificationPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isVerificationDialogOpen, setIsVerificationDialogOpen] = useState(false)

  useEffect(() => {
    setTimeOfDay(getTimeOfDay())
  }, [])

  useEffect(() => {
    setIsEightChars(password.length >= 8)
    setHasUpperCase(/[A-Z]/.test(password))
    setHasNumber(/\d/.test(password))
    setHasSymbol(/[!@#$%^&*(),.?":{}|<>]/.test(password))
  }, [password])

  const handleToggleShowPassword = () => setShowPassword((currentValue) => !currentValue)
  const handleToggleShowConfirmPassword = () =>
    setShowConfirmPassword((currentValue) => !currentValue)

  const openVerificationFlow = ({
    email,
    password: nextPassword,
    openDialog = true,
  }: {
    email: string
    password?: string
    openDialog?: boolean
  }) => {
    const normalizedEmail = normalizeEmail(email)

    setVerificationEmail(normalizedEmail)
    setVerificationPassword(nextPassword ?? '')
    setVerificationCode('')
    setSignInEmail(normalizedEmail)

    if (nextPassword) {
      setSignInPassword(nextPassword)
    }

    setActiveTab('signin')

    if (openDialog) {
      setIsVerificationDialogOpen(true)
    }
  }

  const validateSignInForm = () => {
    const normalizedEmail = normalizeEmail(signInEmail)
    const emailError = validateEmailAddress(normalizedEmail)
    const passwordValue = signInPassword.trim()
    const passwordValidationError = passwordValue ? '' : 'Password is required.'

    setSignInEmailError(emailError)
    setSignInPasswordError(passwordValidationError)

    return {
      isValid: !emailError && !passwordValidationError,
      email: normalizedEmail,
      password: signInPassword,
    }
  }

  const validateSignUpForm = () => {
    const normalizedFirstName = firstName.trim()
    const normalizedLastName = lastName.trim()
    const normalizedPhone = normalizePhoneNumber(phoneNumber)
    const normalizedEmail = normalizeEmail(signUpEmail)
    const firstNameValidationError = validateName(normalizedFirstName, 'First name')
    const lastNameValidationError = validateName(normalizedLastName, 'Last name')
    const phoneValidationError = validatePhoneNumber(normalizedPhone)
    const emailValidationError = validateEmailAddress(normalizedEmail)
    const passwordValidationError = validatePasswordStrength(password)
    const nextConfirmPasswordError =
      !confirmPassword
        ? 'Please confirm your password.'
        : confirmPassword !== password
          ? 'Passwords do not match.'
          : ''

    setFirstNameError(firstNameValidationError)
    setLastNameError(lastNameValidationError)
    setPhoneNumberError(phoneValidationError)
    setSignUpEmailError(emailValidationError)
    setPasswordError(passwordValidationError)
    setConfirmPasswordError(nextConfirmPasswordError)

    return {
      isValid:
        !firstNameValidationError &&
        !lastNameValidationError &&
        !phoneValidationError &&
        !emailValidationError &&
        !passwordValidationError &&
        !nextConfirmPasswordError,
      email: normalizedEmail,
      phone: normalizedPhone,
    }
  }

  const handleResendVerificationCode = async () => {
    if (!verificationEmail) {
      toast.error('Start signup or sign in with your pending account to request a code.')
      return
    }

    setIsLoading(true)

    try {
      const response = await postAuthJson(
        '/api/auth/resend-email-code',
        { email: verificationEmail },
        'We could not resend the verification code right now.'
      )

      setIsVerificationDialogOpen(true)
      toast.success(response.message || 'A fresh verification code has been sent.')
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'We could not resend the verification code right now.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { isValid, email, password: signInPasswordValue } = validateSignInForm()

    if (!isValid) {
      return
    }

    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, signInPasswordValue)
      await userCredential.user.reload()
      const currentUser = auth.currentUser ?? userCredential.user
      const currentUserEmail = normalizeEmail(currentUser.email || email)

      if (!currentUser.emailVerified) {
        await signOut(auth)
        openVerificationFlow({
          email: currentUserEmail,
          password: signInPasswordValue,
        })

        try {
          const response = await postAuthJson(
            '/api/auth/resend-email-code',
            { email: currentUserEmail },
            'Complete your email verification to continue.'
          )

          toast.error(
            response.message ||
              'Complete your email verification to continue. We sent you a fresh code.'
          )
        } catch (resendError) {
          toast.error(
            resendError instanceof Error
              ? resendError.message
              : 'Complete your email verification to continue.'
          )
        }

        setIsLoading(false)
        return
      }

      await syncServerSession(currentUser)
      toast.success('Signed in successfully.')
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      toast.error(getFirebaseSignInErrorMessage(error))
      setIsLoading(false)
    }
  }

  const handleOpenDialog = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const { isValid } = validateSignUpForm()

    if (!isValid) {
      return
    }

    setConfirmCheck(false)
    setIsDialogOpen(true)
  }

  const handleConfirmCreate = async () => {
    if (!confirmCheck) {
      toast.error('Please confirm your details first.')
      return
    }

    const { isValid, email, phone } = validateSignUpForm()

    if (!isValid) {
      setIsDialogOpen(false)
      return
    }

    setIsLoading(true)

    try {
      const response = await postAuthJson(
        '/api/auth/signup',
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phone,
          email,
          password,
        },
        'We could not start signup right now.'
      )

      setIsDialogOpen(false)
      openVerificationFlow({
        email: response.email || email,
        password,
      })
      toast.success(response.message || 'Check your email for the 6-digit verification code.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'We could not start signup right now.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedCode = normalizeVerificationCode(verificationCode)
    const codeValidationError = validateVerificationCode(normalizedCode)

    if (codeValidationError) {
      toast.error(codeValidationError)
      return
    }

    if (!verificationEmail) {
      toast.error('Start signup or sign in first so we know which account to verify.')
      return
    }

    setIsLoading(true)

    try {
      await postAuthJson(
        '/api/auth/verify-email-code',
        {
          email: verificationEmail,
          code: normalizedCode,
        },
        'We could not verify that code right now.'
      )

      setVerificationCode('')
      setIsVerificationDialogOpen(false)

      if (verificationPassword) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          verificationEmail,
          verificationPassword
        )
        await userCredential.user.reload()
        const currentUser = auth.currentUser ?? userCredential.user

        await syncServerSession(currentUser)
        toast.success('Email verified. You are now signed in.')
        router.push('/dashboard')
        router.refresh()
        return
      }

      toast.success('Email verified. Sign in to continue.')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'We could not verify that code right now.'
      )
      setIsLoading(false)
      return
    }

    setIsLoading(false)
  }

  const signInGreeting = timeOfDay
    ? `Good ${timeOfDay}, sign in to your account`
    : 'Sign in to your account'
  const signUpGreeting = timeOfDay
    ? `Good ${timeOfDay}, create your account`
    : 'Create your account'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-gray-100 py-8 dark:bg-gray-900">
      <div className="flex items-center space-x-2 py-4">
        <BrandLogo width={90} height={90} priority />
      </div>

      <Card className="w-[96%] border-0 bg-white shadow-lg dark:bg-gray-800 md:max-w-md">
        <CardHeader>
          <Typography variant="h1" className="font-bold text-gray-600 dark:text-gray-200">
            {activeTab === 'signin' ? 'Welcome Back!' : 'Join Xcrow Today!'}
          </Typography>
          <CardDescription className="text-gray-500 dark:text-gray-300">
            {activeTab === 'signin' ? signInGreeting : signUpGreeting}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {verificationEmail && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/20">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Email verification required
              </p>
              <p className="mt-1 text-gray-600 dark:text-gray-300">
                Enter the 6-digit code sent to <strong>{verificationEmail}</strong> before
                you continue.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => setIsVerificationDialogOpen(true)}
                  disabled={isLoading}
                >
                  Enter Code
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendVerificationCode}
                  disabled={isLoading}
                >
                  Resend Code
                </Button>
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-lg bg-gray-50 font-bold shadow-sm dark:bg-gray-700">
              <TabsTrigger
                value="signin"
                className={cn(
                  'rounded-lg px-4 py-1 text-purple-600 transition-colors hover:text-purple-800',
                  'data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 shadow-sm'
                )}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className={cn(
                  'rounded-lg px-4 py-1 text-purple-600 transition-colors hover:text-purple-800',
                  'data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 shadow-sm'
                )}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignInSubmit}>
                <div className="space-y-2 md:space-y-4">
                  <Input
                    id="signinEmail"
                    placeholder="Email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                  />
                  {signInEmailError && <p className="mt-1 text-sm text-red-500">{signInEmailError}</p>}

                  <div className="relative space-y-2 md:space-y-4">
                    <Input
                      id="signinPassword"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoComplete="current-password"
                      disabled={isLoading}
                      value={signInPassword}
                      onChange={(event) => setSignInPassword(event.target.value)}
                    />
                    {signInPasswordError && (
                      <p className="mt-1 text-sm text-red-500">{signInPasswordError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleShowPassword}
                      className="absolute right-2 top-[0.3rem] text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="w-full text-end">
                    <Link href="/password-reset">
                      <Typography
                        variant="span"
                        className="cursor-pointer text-primary hover:opacity-80"
                      >
                        Forgot password?
                      </Typography>
                    </Link>
                  </div>

                  <Button className="h-[2.8rem] w-full" type="submit" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleOpenDialog}>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:space-x-2">
                    <div className="flex-1">
                      <Input
                        id="firstName"
                        placeholder="First Name"
                        disabled={isLoading}
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                      />
                      {firstNameError && <p className="mt-1 text-sm text-red-500">{firstNameError}</p>}
                    </div>
                    <div className="mt-4 flex-1 sm:mt-0">
                      <Input
                        id="lastName"
                        placeholder="Last Name"
                        disabled={isLoading}
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                      />
                      {lastNameError && <p className="mt-1 text-sm text-red-500">{lastNameError}</p>}
                    </div>
                  </div>

                  <Input
                    id="phone"
                    placeholder="Phone Number"
                    type="tel"
                    disabled={isLoading}
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                  {phoneNumberError && <p className="mt-1 text-sm text-red-500">{phoneNumberError}</p>}

                  <Input
                    id="signUpEmail"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                  />
                  {signUpEmailError && <p className="mt-1 text-sm text-red-500">{signUpEmailError}</p>}

                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    {passwordError && <p className="mt-1 text-sm text-red-500">{passwordError}</p>}
                    <button
                      type="button"
                      onClick={handleToggleShowPassword}
                      className="absolute right-2 top-[0.8rem] text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <ul className="mb-2 ml-1 list-inside list-disc text-xs">
                    <li
                      className={
                        isEightChars ? 'text-green-600 dark:text-green-400' : 'text-red-600'
                      }
                    >
                      At least 8 characters
                    </li>
                    <li
                      className={
                        hasUpperCase ? 'text-green-600 dark:text-green-400' : 'text-red-600'
                      }
                    >
                      At least 1 uppercase letter
                    </li>
                    <li
                      className={
                        hasNumber ? 'text-green-600 dark:text-green-400' : 'text-red-600'
                      }
                    >
                      At least 1 number
                    </li>
                    <li
                      className={
                        hasSymbol ? 'text-green-600 dark:text-green-400' : 'text-red-600'
                      }
                    >
                      At least 1 symbol
                    </li>
                  </ul>

                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      placeholder="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                    {confirmPasswordError && (
                      <p className="mt-1 text-sm text-red-500">{confirmPasswordError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleShowConfirmPassword}
                      className="absolute right-2 top-[0.8rem] text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center space-x-2">
                    <Checkbox id="terms" required className="h-[1.5rem] w-[1.5rem]" />
                    <label htmlFor="terms" className="text-sm text-gray-500 dark:text-gray-400">
                      I agree to the{' '}
                      <Link href="/terms" className="underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <Button className="h-[2.8rem] w-full" type="submit" disabled={isLoading}>
                    {isLoading ? 'Please wait...' : 'Review & Create'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Confirm Your Details</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Please verify all information is correct before creating your account.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-2 text-sm">
            <p>
              <strong>First Name:</strong> {firstName.trim()}
            </p>
            <p>
              <strong>Last Name:</strong> {lastName.trim()}
            </p>
            <p>
              <strong>Phone:</strong> {normalizePhoneNumber(phoneNumber)}
            </p>
            <p>
              <strong>Email:</strong> {normalizeEmail(signUpEmail)}
            </p>
          </div>

          <div className="mt-2 flex items-center space-x-2">
            <Checkbox
              id="confirmCheck"
              checked={confirmCheck}
              onChange={(event) => setConfirmCheck(event.target.checked)}
            />
            <Label htmlFor="confirmCheck" className="text-sm text-gray-500 dark:text-gray-300">
              I confirm all the above details are correct
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Go Back
            </Button>
            <Button
              onClick={handleConfirmCreate}
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/80"
            >
              {isLoading ? 'Creating...' : 'Confirm & Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isVerificationDialogOpen} onOpenChange={setIsVerificationDialogOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Verify Your Email</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Enter the 6-digit code sent to {verificationEmail || 'your email address'}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode">Verification Code</Label>
              <Input
                id="verificationCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={verificationCode}
                disabled={isLoading}
                onChange={(event) =>
                  setVerificationCode(normalizeVerificationCode(event.target.value))
                }
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The code expires in 10 minutes.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleResendVerificationCode}
                disabled={isLoading}
              >
                Resend Code
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
