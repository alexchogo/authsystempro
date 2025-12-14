'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token')
      
      if (!token) {
        toast.error('No verification token provided')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        if (!response.ok) {
          throw new Error((await response.json()).message || 'Verification failed')
        }

        setIsVerified(true)
        toast.success('Email verified successfully!')
        setTimeout(() => router.push('/authpage/signin'), 2000)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Email verification failed'
        toast.error(errorMessage)
        setIsLoading(false)
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>Verifying your email address...</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {isLoading && !isVerified && (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-gray-600">Verifying your email...</p>
            </>
          )}
          {isVerified && (
            <>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <p className="text-center text-green-600 font-medium">Email verified successfully!</p>
              <p className="text-center text-gray-600 text-sm mt-2">Redirecting to sign in...</p>
            </>
          )}
          {!isLoading && !isVerified && (
            <Button onClick={() => router.push('/authpage/signin')}>
              Back to Sign In
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
