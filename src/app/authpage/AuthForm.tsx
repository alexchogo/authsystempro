
//FloatingInput with an outlined wrapper and overlapping floating label
"use client"
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupInput, InputGroupButton } from '@/components/ui/input-group'
import { Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useRouter } from 'next/navigation'
import * as authService from '@/lib/authService'
import { toast } from 'sonner'
import { setCookie } from '@/lib/cookies'

// Types
type LoginFormData = {
  email: string
  password: string
}

type RegisterFormData = {
  fullName: string
  email: string
  username: string
  password: string
  phone: string
}

type ForgotPasswordFormData = {
  email: string
}

type OtpFormData = {
  code: string
}

type ResetPasswordFormData = {
  password: string
  confirmPassword: string
}

type FormData = LoginFormData | RegisterFormData | ForgotPasswordFormData | OtpFormData | ResetPasswordFormData

// Schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(6, 'Phone number must be at least 6 characters'),
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
})

const otpSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
})

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type AuthFormProps = {
  mode: 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'reset-password'
  token?: string
}

export default function AuthForm({ mode, token }: AuthFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Select schema based on mode
  const getSchema = () => {
    switch (mode) {
      case 'login':
        return loginSchema
      case 'register':
        return registerSchema
      case 'forgot-password':
        return forgotPasswordSchema
      case 'verify-otp':
        return otpSchema
      case 'reset-password':
        return resetPasswordSchema
    }
  }

  const getDefaultValues = () => {
    switch (mode) {
      case 'login':
        return { email: '', password: '' }
      case 'register':
        return { email: '', password: '', fullName: '', username: '', phone: '' }
      case 'forgot-password':
        return { email: '' }
      case 'verify-otp':
        return { code: '' }
      case 'reset-password':
        return { password: '', confirmPassword: '' }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<any>({
    resolver: zodResolver(getSchema()),
    defaultValues: getDefaultValues(),
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      switch (mode) {
        case 'login':
          const signinResult = await authService.signin(data as LoginFormData)
          toast.success('Check your email for OTP code')
          localStorage.setItem('pendingUserId', signinResult.userId)
            // mark OTP sent timestamp and expiry (10 minutes)
            try {
              const now = Date.now()
              const expires = now + 10 * 60 * 1000
              localStorage.setItem('otpSentAt', String(now))
              localStorage.setItem('otpExpiresAt', String(expires))
            } catch (e) {
              // ignore storage errors
            }
            router.push('/authpage/otp')
          break
        case 'register':
          await authService.signup(data as RegisterFormData)
          toast.success('Account created! Check your email to verify.')
          router.push('/authpage/verify-email')
          break
        case 'forgot-password':
          await authService.requestPasswordReset(data as ForgotPasswordFormData)
          toast.success('Password reset email sent!')
          router.push('/authpage/signin')
          break
        case 'verify-otp':
          const userId = localStorage.getItem('pendingUserId')
          if (!userId) throw new Error('No pending verification')
          const otpResult = await authService.verifyOtp({ userId, code: (data as OtpFormData).code })
          localStorage.removeItem('pendingUserId')
          // Store token in both cookie (for middleware) and localStorage (for API calls)
          setCookie('authToken', otpResult.token, 7)
          localStorage.setItem('authToken', otpResult.token)
          toast.success('OTP verified!')
          router.push('/dashboard')
          break
        case 'reset-password':
          if (!token) throw new Error('Invalid reset token')
          await authService.resetPassword({ token, password: (data as ResetPasswordFormData).password })
          toast.success('Password reset successfully!')
          router.push('/authpage/signin')
          break
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Login'
      case 'register':
        return 'Create Account'
      case 'forgot-password':
        return 'Reset Password'
      case 'verify-otp':
        return 'Verify OTP'
      case 'reset-password':
        return 'Set New Password'
    }
  }

  const getDescription = () => {
    switch (mode) {
      case 'login':
        return 'Welcome back! Please login to your account.'
      case 'register':
        return 'Create a new account'
      case 'forgot-password':
        return 'Enter your email to reset your password'
      case 'verify-otp':
        return 'Enter the 6-digit code sent to your email'
      case 'reset-password':
        return 'Enter your new password'
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader className={mode === 'login' ? 'text-center space-y-4' : ''}>
          <CardTitle>{getTitle()}</CardTitle>
          <CardDescription>{getDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {(mode === 'login' || mode === 'register') && (
                <>
                  {mode === 'register' && (
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {mode === 'register' && (
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {mode === 'register' && (
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                          <FormControl>
                          <InputGroup>
                            <InputGroupInput
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter your password"
                              {...field}
                            />
                            <InputGroupButton
                              onClick={() => setShowPassword((s) => !s)}
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </InputGroupButton>
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {mode === 'login' && (
                    <div className="text-left">
                      <button
                        type="button"
                        onClick={() => router.push('/authpage/forgot')}
                        className="text-sm text-primary underline decoration-primary underline-offset-2"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </>
              )}
              {mode === 'forgot-password' && (
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {mode === 'verify-otp' && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OTP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="000000" maxLength={6} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {mode === 'reset-password' && (
                <>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <InputGroup>
                              <InputGroupInput
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                {...field}
                              />
                              <InputGroupButton
                                onClick={() => setShowPassword((s) => !s)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                              >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </InputGroupButton>
                            </InputGroup>
                          </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <InputGroup>
                            <InputGroupInput
                              type={showConfirm ? 'text' : 'password'}
                              placeholder="••••••••"
                              {...field}
                            />
                            <InputGroupButton
                              onClick={() => setShowConfirm((s) => !s)}
                              aria-label={showConfirm ? 'Hide password' : 'Show password'}
                            >
                              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                            </InputGroupButton>
                          </InputGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Loading...' : getTitle()}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
