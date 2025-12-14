import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getAuthContext } from '@/lib/auth/context'
import { getRequestMetadata } from '@/lib/requestUtils'
import { logAuditEvent } from '@/lib/auditLog'
import { generateVerificationTokenAndStore } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/send'
import { z } from 'zod'

export const runtime = 'nodejs'

const RequestChangeBody = z.object({ newEmail: z.string().email() })
const ConfirmChangeBody = z.object({ token: z.string(), newEmail: z.string().email() })

// Request email change (sends verification to new email)
export const POST = errorHandler(
  authorize(
    requireAuth(async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

      const body = await req.json()
      const parsed = RequestChangeBody.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })

      const { newEmail } = parsed.data
      const { ipAddress, userAgent } = getRequestMetadata(req)

      // Check if new email already in use
      const existing = await prisma.user.findUnique({ where: { email: newEmail } })
      if (existing) {
        await logAuditEvent('EMAIL_CHANGE_REQUESTED', ctx.user.id, { newEmail, status: 'failed_email_exists' }, ipAddress, userAgent)
        return NextResponse.json({ message: 'Email already in use' }, { status: 409 })
      }

      // Generate token for new email verification
      const token = await generateVerificationTokenAndStore(ctx.user.id)
      
      // Log the request with old and new email
      await logAuditEvent(
        'EMAIL_CHANGE_REQUESTED',
        ctx.user.id,
        { oldEmail: ctx.user.email, newEmail, token, status: 'pending_verification' },
        ipAddress,
        userAgent
      )

      // Send verification to NEW email address
      await sendVerificationEmail(newEmail, token)

      return NextResponse.json({ ok: true, message: 'Verification email sent to new email address' })
    })
  )
)

// Confirm email change with token
export const PATCH = errorHandler(
  authorize(
    requireAuth(async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

      const body = await req.json()
      const parsed = ConfirmChangeBody.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })

      const { token, newEmail } = parsed.data
      const { ipAddress, userAgent } = getRequestMetadata(req)

      // Verify token
      const vt = await prisma.verificationToken.findUnique({ where: { token } })
      if (!vt || vt.expiresAt < new Date() || vt.userId !== ctx.user.id) {
        await logAuditEvent('EMAIL_CHANGE_COMPLETED', ctx.user.id, { status: 'failed_invalid_token' }, ipAddress, userAgent)
        return NextResponse.json({ message: 'Invalid or expired token' }, { status: 400 })
      }

      const oldEmail = ctx.user.email
      
      // Update email
      const updated = await prisma.user.update({
        where: { id: ctx.user.id },
        data: { email: newEmail }
      })

      // Clean up verification token
      await prisma.verificationToken.deleteMany({ where: { userId: ctx.user.id } })

      // Log successful change
      await logAuditEvent(
        'EMAIL_CHANGE_COMPLETED',
        ctx.user.id,
        { oldEmail, newEmail: updated.email, status: 'success' },
        ipAddress,
        userAgent
      )

      return NextResponse.json({ ok: true, user: { id: updated.id, email: updated.email } })
    })
  )
)
