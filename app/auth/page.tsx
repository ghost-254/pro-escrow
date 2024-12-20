'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { toast } from '@/hooks/use-toast'
import Checkbox from '@/components/ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'
import { grey } from '@/components/ui/color'

export default function AuthPage() {
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('signin')
  const [emailError, setEmailError] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')
  const router = useRouter()

  const handleToggleshow = (): void => {
    setShowPassword((prev) => !prev)
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const validateEmail = (email: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return 'Email is required.'
    if (!emailRegex.test(email)) return 'Invalid email address.'
    return ''
  }

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required.'
    if (password.length < 8) return 'Password must be at least 8 characters.'
    return ''
  }

  const validateForm = (): boolean => {
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)

    setEmailError(emailError)
    setPasswordError(passwordError)

    return !emailError && !passwordError
  }

  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setIsLoading(false)
    // if (error) {
    //   // toast({
    //   //   title: 'Error',
    //   //   description: error.message,
    //   //   variant: 'destructive',
    //   // })
    // } else {
    //   router.push('/')
    //   router.refresh()
    // }
  }

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })
    setIsLoading(false)
    // if (error) {
    //   toast({
    //     title: 'Error',
    //     description: error.message,
    //     variant: 'destructive',
    //   })
    // } else {
    //   toast({
    //     title: 'Success',
    //     description: 'Check your email to confirm your account.',
    //   })
    // }
  }

  return (
    <div className="w-full h-full container flex flex-col items-center mt-[5rem]">
      <Card className="md:w-[400px] w-full">
        <CardHeader>
          <CardTitle>
            {activeTab === 'signin'
              ? 'Good Afternoon,'
              : 'You are Invited to Labscro'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'signin'
              ? 'Welcome to Labscro'
              : 'Create account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            onValueChange={(value) => {
              if (value === 'signin') {
                setActiveTab('signin')
              } else if (value === 'signup') {
                setActiveTab('signup')
              }
            }}
            defaultValue="signin"
            className="w-full flex flex-col gap-[1rem]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={signIn}>
                <div className="grid gap-[0.5rem]">
                  <div className="w-full flex flex-col gap-[0.5rem]">
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {emailError && (
                      <p
                        style={{ color: '#ff4f4f', paddingLeft: '1rem' }}
                        className="text-sm"
                      >
                        {emailError}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <div className="w-full flex flex-col gap-[0.5rem]">
                      <Input
                        id="password"
                        placeholder={'Password'}
                        type={showPassword ? 'text' : 'password'}
                        autoCapitalize="none"
                        disabled={isLoading}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      {passwordError && (
                        <p
                          style={{ color: '#ff4f4f', paddingLeft: '1rem' }}
                          className="text-sm"
                        >
                          {passwordError}
                        </p>
                      )}
                    </div>
                    {!showPassword ? (
                      <EyeOff
                        onClick={handleToggleshow}
                        className="h-5 w-5 absolute cursor-pointer right-[0.6rem] top-[0.55rem] text-grey[200]"
                        aria-hidden="true"
                        style={{ color: grey[600] }}
                      />
                    ) : (
                      <Eye
                        onClick={handleToggleshow}
                        className="h-5 w-5 absolute cursor-pointer right-[0.6rem] top-[0.55rem] text-grey[200]"
                        aria-hidden="true"
                        style={{ color: grey[600] }}
                      />
                    )}
                  </div>
                  <Button variant="default" disabled={isLoading}>
                    {isLoading ? (
                      <span className="mr-2">Loading...</span>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signUp}>
                <div className="grid gap-[0.5rem]">
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  {emailError && (
                    <p
                      style={{ color: '#ff4f4f', paddingLeft: '1rem' }}
                      className="text-sm"
                    >
                      {emailError}
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
                      <p
                        style={{ color: '#ff4f4f', paddingLeft: '1rem' }}
                        className="text-sm"
                      >
                        {passwordError}
                      </p>
                    )}
                    {!showPassword ? (
                      <EyeOff
                        onClick={handleToggleshow}
                        className="h-5 w-5 absolute right-[0.6rem] top-[0.55rem] text-grey[200]"
                        aria-hidden="true"
                        style={{ color: grey[600] }}
                      />
                    ) : (
                      <Eye
                        onClick={handleToggleshow}
                        className="h-5 w-5 absolute right-[0.6rem] top-[0.55rem] text-grey[200]"
                        aria-hidden="true"
                        style={{ color: grey[600] }}
                      />
                    )}
                  </div>
                  <Button variant="default" disabled={isLoading}>
                    {isLoading ? (
                      <span className="mr-2">Loading...</span>
                    ) : (
                      'Sign Up'
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        {activeTab !== 'signin' && (
          <CardFooter className="flex items-center gap-[0.5rem] md:gap-[1rem]">
            {/* Simple checkbox without label */}
            <Checkbox />
            <p className="text-sm text-muted-foreground">
              By continuing, you agree to our{' '}
              <b
                title="Terms of Service"
                className="cursor-pointer hover:text-primary"
              >
                {' '}
                Terms of Service
              </b>{' '}
              and
              <b
                title="Privacy Policy"
                className="cursor-pointer hover:text-primary"
              >
                {' '}
                Privacy Policy
              </b>{' '}
              .
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
