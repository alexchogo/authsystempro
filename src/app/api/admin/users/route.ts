import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requirePermission } from '@/lib/auth/requirePermission'
import { getAuthContext } from '@/lib/auth/context'
import { getRequestMetadata } from '@/lib/requestUtils'
import { logAuditEvent } from '@/lib/auditLog'
import { z } from 'zod'
import { generateResetTokenAndStore, createSessionTokenAndStore } from '@/lib/tokens'
import { sendResetEmail } from '@/lib/send'

export const runtime = 'nodejs'

const ActionBody = z.object({ userId: z.string(), action: z.enum(['impersonate', 'lock', 'unlock', 'reset']) })

export const GET = errorHandler(
  authorize(
    requireAuth(requirePermission('user.read', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId')
      if (!userId) return NextResponse.json({ message: 'Missing userId' }, { status: 400 })
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true, username: true, phone: true, emailVerified: true, createdAt: true, deletedAt: true }
      })
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
      return NextResponse.json({ ok: true, user })
    }))
  )
)

export const POST = errorHandler(
  authorize(
    requireAuth(requirePermission('user.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = ActionBody.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { userId, action } = parsed.data
      const { ipAddress, userAgent } = getRequestMetadata(req)

      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

      if (action === 'impersonate') {
        // Create a session token for the target user and return it
        const token = await createSessionTokenAndStore(userId, { ipAddress, userAgent })
        await logAuditEvent('SESSION_CREATED', userId, { impersonatedBy: ctx.user.id }, ipAddress, userAgent)
        return NextResponse.json({ ok: true, token })
      }

      if (action === 'lock') {
        await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } })
        await logAuditEvent('ACCOUNT_DEACTIVATED', userId, { by: ctx.user.id }, ipAddress, userAgent)
        return NextResponse.json({ ok: true, message: 'User locked' })
      }

      if (action === 'unlock') {
        await prisma.user.update({ where: { id: userId }, data: { deletedAt: null } })
        await logAuditEvent('ACCOUNT_REACTIVATED', userId, { by: ctx.user.id }, ipAddress, userAgent)
        return NextResponse.json({ ok: true, message: 'User unlocked' })
      }

      if (action === 'reset') {
        const token = await generateResetTokenAndStore(userId)
        try { await sendResetEmail(user.email, token) } catch (err) { /* continue */ }
        await logAuditEvent('RESET_REQUEST', userId, { by: ctx.user.id }, ipAddress, userAgent)
        return NextResponse.json({ ok: true, message: 'Reset token created/sent' })
      }

      return NextResponse.json({ message: 'Unknown action' }, { status: 400 })
    }))
  )
)
