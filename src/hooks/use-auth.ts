'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/lib/cookies'

/**
 * Hook to check if user is authenticated
 * Redirects to signin if not authenticated
 */
export function useRequireAuth() {
  const router = useRouter()

  useEffect(() => {
    const authToken = getCookie('authToken') || localStorage.getItem('authToken')
    
    if (!authToken) {
      router.push('/authpage/signin')
    }
  }, [router])
}

/**
 * Hook to redirect authenticated users away from auth pages
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter()

  useEffect(() => {
    const authToken = getCookie('authToken') || localStorage.getItem('authToken')
    
    if (authToken) {
      router.push('/dashboard')
    }
  }, [router])
}
