"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Lock } from "lucide-react"
import * as authService from "@/lib/authService"
import { toast } from "sonner"
import { setCookie } from "@/lib/cookies"

const OTP_EXPIRY_MS = 10 * 60 * 1000

export default function OtpPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [nowTs, setNowTs] = useState(Date.now())

  // read expiry from localStorage (set by signin/resend)
  const expiresAt = (() => {
    try {
      const raw = localStorage.getItem("otpExpiresAt")
      return raw ? Number(raw) : null
    } catch {
      return null
    }
  })()

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const isExpired = expiresAt ? nowTs > expiresAt : false

  const handleVerify = async () => {
    const userId = localStorage.getItem("pendingUserId")
    if (!userId) {
      toast.error("No pending verification found")
      return
    }
    if (!code || code.length < 6) {
      toast.error("Please enter the full OTP code")
      return
    }

    if (isExpired) {
      // If expired, change action to resend
      await handleResend()
      return
    }

    setIsVerifying(true)
    try {
      const res = await authService.verifyOtp({ userId, code })
      setCookie("authToken", res.token, 7)
      localStorage.setItem("authToken", res.token)
      localStorage.removeItem("pendingUserId")
      toast.success("OTP verified!")
      router.push("/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to verify OTP"
      toast.error(message)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    const userId = localStorage.getItem("pendingUserId")
    if (!userId) {
      toast.error("No pending verification found")
      return
    }
    setIsResending(true)
    try {
      await authService.resendOtp({ userId })
      // set new expiry
      try {
        const now = Date.now()
        localStorage.setItem("otpSentAt", String(now))
        localStorage.setItem("otpExpiresAt", String(now + OTP_EXPIRY_MS))
      } catch {
        // ignore
      }
      toast.success("OTP code resent! Check your email.")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend OTP"
      toast.error(message)
    } finally {
      setIsResending(false)
    }
  }

  // compute remaining time for display
  const remaining = expiresAt ? Math.ceil(Math.max(0, expiresAt - nowTs) / 1000) : null

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center">
          <Lock className="mb-2 text-muted-foreground" size={36} />
          <CardTitle className="text-center">Verify OTP</CardTitle>
          <CardDescription className="text-center">Enter the OTP code we just emailed you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <InputOTP maxLength={6} value={code} onChange={(v: string) => setCode(v)}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <div className="w-full flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
              <button
                type="button"
                onClick={handleResend}
                className="text-primary hover:underline"
                disabled={isResending}
              >
                {isResending ? 'Resending...' : 'Resend'}
              </button>
            </div>

            <div className="w-full">
              <Button className="w-full" onClick={handleVerify} disabled={isVerifying || isResending}>
                {isExpired ? 'Resend OTP' : isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
              {remaining !== null && (
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  {isExpired ? 'OTP expired' : `Expires in ${remaining}s`}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
