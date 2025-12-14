'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthPage() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>Choose an action to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => router.push('/authpage/signin')} 
            className="w-full"
          >
            Sign In
          </Button>
          <Button 
            onClick={() => router.push('/authpage/signup')} 
            variant="outline"
            className="w-full"
          >
            Create Account
          </Button>
          <Button 
            onClick={() => router.push('/authpage/forgot')} 
            variant="ghost"
            className="w-full"
          >
            Forgot Password
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}