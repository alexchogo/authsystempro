'use client'

import { useEffect, useRef } from 'react'
import { getCookie, deleteCookie } from '@/lib/cookies'
import { logout } from '@/lib/authService'

type IdleLogoutProps = {
  timeoutMs?: number
  onLogout?: () => void
}

export default function IdleLogout({ timeoutMs = 15 * 60 * 1000, onLogout }: IdleLogoutProps) {
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const resetTimer = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(async () => {
        const token = getCookie('authToken') || localStorage.getItem('authToken') || undefined
        try {
          await logout({ token })
        } catch {}
        deleteCookie('authToken')
        localStorage.removeItem('authToken')
        onLogout?.()
        window.location.href = '/authpage/signin?reason=idle'
      }, timeoutMs)
    }

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart', 'visibilitychange'] as const
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer))
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [timeoutMs, onLogout])

  return null
}
