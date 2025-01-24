'use client'

import React, { useState, useEffect, FormEvent, JSX } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Checkbox from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-react'
import { auth, db } from '@/lib/firebaseConfig'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

// shadcn/ui Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import Typography from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { getTimeOfDay } from '@/lib/dateTime'

const logo = '/logo11xx.png'

export default function AuthPage(): JSX.Element {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Sign In States
  const [signInEmail, setSignInEmail] = useState('')
  const [signInPassword, setSignInPassword] = useState('')
  const [signInEmailError, setSignInEmailError] = useState('')
  const [signInPasswordError, setSignInPasswordError] = useState('')

  // Sign Up States
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Real-time password criteria
  const [isEightChars, setIsEightChars] = useState(false)
  const [hasUpperCase, setHasUpperCase] = useState(false)
  const [hasNumber, setHasNumber] = useState(false)
  const [hasSymbol, setHasSymbol] = useState(false)

  // Show errors
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [phoneNumberError, setPhoneNumberError] = useState('')
  const [signUpEmailError, setSignUpEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

  // Show/hide password fields
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Dialog for final sign-up confirmation
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmCheck, setConfirmCheck] = useState(false)

  const router = useRouter()

  // Toggle password visibility
  const handleToggleShowPassword = () => setShowPassword(!showPassword)
  const handleToggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword)

  // ----------------- VALIDATIONS -----------------
  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required.'
    if (!emailRegex.test(email)) return 'Invalid email address.'
    return ''
  }

  const validatePassword = (pw: string): string => {
    if (!pw) return 'Password is required.'
    if (pw.length < 8) return 'Password must be at least 8 characters.'
    return ''
  }

  const checkPasswordCriteria = (pw: string) => {
    setIsEightChars(pw.length >= 8)
    setHasUpperCase(/[A-Z]/.test(pw))
    setHasNumber(/\d/.test(pw))
    setHasSymbol(/[!@#$%^&*(),.?":{}|<>]/.test(pw))
  }

  // ----------------- SIGN IN LOGIC -----------------
  const handleSignInSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Basic validation
    const emailErr = validateEmail(signInEmail)
    const pwErr = validatePassword(signInPassword)
    setSignInEmailError(emailErr)
    setSignInPasswordError(pwErr)

    if (emailErr || pwErr) return

    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, signInEmail, signInPassword)
      toast.success('Signed in successfully!')
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error(`Error signing in: ${errorMessage}`)
      setIsLoading(false)
    }
  }

  // ----------------- SIGN UP LOGIC -----------------
  const validateSignUpForm = (): boolean => {
    let valid = true

    // First name
    if (!firstName) {
      setFirstNameError('First name is required (no pseudo).')
      valid = false
    } else {
      setFirstNameError('')
    }

    // Last name
    if (!lastName) {
      setLastNameError('Last name is required (no pseudo).')
      valid = false
    } else {
      setLastNameError('')
    }

    // Phone number
    if (!phoneNumber) {
      setPhoneNumberError('Phone number is required.')
      valid = false
    } else {
      const phoneRegex = /^[0-9]{7,15}$/
      if (!phoneRegex.test(phoneNumber)) {
        setPhoneNumberError('Invalid phone number format.')
        valid = false
      } else {
        setPhoneNumberError('')
      }
    }

    // Email
    const emailErr = validateEmail(signUpEmail)
    setSignUpEmailError(emailErr)
    if (emailErr) valid = false

    // Password
    const pwErr = validatePassword(password)
    setPasswordError(pwErr)
    if (pwErr) valid = false

    // Confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.')
      valid = false
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match.')
      valid = false
    } else {
      setConfirmPasswordError('')
    }

    return valid
  }

  // Step 1: open summary dialog if form is valid
  const handleOpenDialog = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validateSignUpForm()) return

    setIsDialogOpen(true)
  }

  // Step 2: actually create account in Firebase
  const handleConfirmCreate = async () => {
    if (!confirmCheck) {
      toast.error('Please confirm your details first.')
      return
    }

    setIsLoading(true)
    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signUpEmail,
        password
      )
      const user = userCredential.user

      // Update displayName
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
      })

      // Save in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        firstName,
        lastName,
        phoneNumber,
        email: signUpEmail,
        createdAt: new Date().toISOString(),
      })

      toast.success('Account created successfully!')
      setIsDialogOpen(false)
      setTimeout(() => {
        router.push('/')
      }, 1500)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred'
      toast.error(`Error creating account: ${errorMessage}`)
      setIsLoading(false)
    }
  }

  // Re-check password criteria on each change
  useEffect(() => {
    checkPasswordCriteria(password)
  }, [password])

  return (
    <div
      className="
        min-h-screen
        h-full
        flex
        flex-col
        justify-center
        items-center
        bg-center
        bg-cover
        bg-no-repeat
      "
      style={{
        background: '#f5f5f5',
      }}
    >
      {/* Logo / Brand */}
      <div className="flex items-center space-x-2 py-[1rem]">
        <Image
          src={logo}
          alt="Platform Logo"
          width={90}
          height={90}
          className="object-contain"
          priority
        />
        {/* If you only want the image, remove this span.
              If you need an accessible text label, keep it as sr-only. */}
        <span className="sr-only">Xcrows</span>
      </div>
      <Card className=" w-[96%] mb-[10rem] lg:mb-0 md:max-w-md bg-white shadow-lg border-0">
        <CardHeader>
          <Typography variant="h1" className="font-bold text-gray-600">
            {activeTab === 'signin' ? 'Welcome Back!' : 'Join Xcrow Today!'}
          </Typography>
          <CardDescription>
            {activeTab === 'signin'
              ? `Good ${getTimeOfDay()}, sign in to your account`
              : `Good ${getTimeOfDay()}, create an account to get started`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as 'signin' | 'signup')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-50 font-bold rounded-lg shadow-sm">
              <TabsTrigger
                value="signin"
                className={cn(
                  'px-4 py-1 text-purple-600 hover:text-purple-800 rounded-lg transition-colors',
                  'data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 shadow-sm'
                )}
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className={cn(
                  'px-4 py-1 text-purple-600 hover:text-purple-800 rounded-lg transition-colors',
                  'data-[state=active]:bg-purple-100 data-[state=active]:text-purple-900 shadow-sm'
                )}
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            {/* ------------ SIGN IN ------------- */}
            <TabsContent value="signin">
              <form onSubmit={handleSignInSubmit}>
                <div className="md:space-y-4 space-y-2 ">
                  <Input
                    id="signinEmail"
                    placeholder="Email"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                  />
                  {signInEmailError && (
                    <p className="text-sm text-red-500 mt-1">
                      {signInEmailError}
                    </p>
                  )}

                  <div className="relative md:space-y-4 space-y-2">
                    <Input
                      id="signinPassword"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      disabled={isLoading}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                    />
                    {signInPasswordError && (
                      <p className="text-sm text-red-500 mt-1">
                        {signInPasswordError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleShowPassword}
                      className="absolute right-2 top-[0.8rem] text-gray-400
                        dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  <div className="w-full text-end">
                    <Typography
                      variant="span"
                      className="text-primary cursor-pointer hover:opacity-[0.77]"
                    >
                      Forgot password?
                    </Typography>
                  </div>

                  <Button
                    className="w-full h-[2.8rem]"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* ------------ SIGN UP ------------- */}
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
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                      {firstNameError && (
                        <p className="text-sm text-red-500 mt-1">
                          {firstNameError}
                        </p>
                      )}
                    </div>
                    <div className="flex-1 mt-4 sm:mt-0">
                      <Input
                        id="lastName"
                        placeholder="Last Name"
                        disabled={isLoading}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                      {lastNameError && (
                        <p className="text-sm text-red-500 mt-1">
                          {lastNameError}
                        </p>
                      )}
                    </div>
                  </div>

                  <Input
                    id="phone"
                    placeholder="Phone Number (e.g., 254712345678)"
                    type="tel"
                    disabled={isLoading}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  {phoneNumberError && (
                    <p className="text-sm text-red-500 mt-1">
                      {phoneNumberError}
                    </p>
                  )}

                  <Input
                    id="signUpEmail"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    disabled={isLoading}
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                  />
                  {signUpEmailError && (
                    <p className="text-sm text-red-500 mt-1">
                      {signUpEmailError}
                    </p>
                  )}

                  <div className="relative">
                    <Input
                      id="password"
                      placeholder="Password"
                      type={showPassword ? 'text' : 'password'}
                      autoCapitalize="none"
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {passwordError && (
                      <p className="text-sm text-red-500 mt-1">
                        {passwordError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleShowPassword}
                      className="absolute right-2 top-[0.8rem] text-gray-400
                        dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Password Criteria */}
                  <ul className="list-disc list-inside text-xs ml-1 mb-2">
                    <li
                      className={
                        isEightChars
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600'
                      }
                    >
                      At least 8 characters
                    </li>
                    <li
                      className={
                        hasUpperCase
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600'
                      }
                    >
                      At least 1 uppercase letter
                    </li>
                    <li
                      className={
                        hasNumber
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600'
                      }
                    >
                      At least 1 number
                    </li>
                    <li
                      className={
                        hasSymbol
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600'
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
                      disabled={isLoading}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPasswordError && (
                      <p className="text-sm text-red-500 mt-1">
                        {confirmPasswordError}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleToggleShowConfirmPassword}
                      className="absolute right-2 top-[0.8rem] text-gray-400
                        dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-100"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>

                  {/* Terms */}
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox
                      id="terms"
                      required
                      className="w-[1.5rem h-[1.5rem]"
                    />

                    <label
                      htmlFor="terms"
                      className="text-sm text-gray-500 dark:text-gray-400"
                    >
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

                  <Button
                    className="w-full h-[2.8rem]"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Please wait...' : 'Review & Create'}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Final Confirmation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle>Confirm Your Details</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Please verify all information is correct before creating your
              account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 my-4 text-sm">
            <p>
              <strong>First Name:</strong> {firstName}
            </p>
            <p>
              <strong>Last Name:</strong> {lastName}
            </p>
            <p>
              <strong>Phone:</strong> {phoneNumber}
            </p>
            <p>
              <strong>Email:</strong> {signUpEmail}
            </p>
          </div>

          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="confirmCheck"
              // Type for onCheckedChange: (checked: boolean | "indeterminate") => void
              onChange={(e) => setConfirmCheck(e.target.checked)}
            />
            <Label
              htmlFor="confirmCheck"
              className="text-sm text-gray-500 dark:text-gray-300"
            >
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
    </div>
  )
}
