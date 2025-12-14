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

export const runtime = 'nodejs'

export const GET = errorHandler(
  authorize(
    requireAuth(requirePermission('session.read', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId') || undefined
      const sessions = await prisma.session.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } })
      return NextResponse.json({ ok: true, sessions })
    }))
  )
)

const TerminateSchema = z.object({ jwtToken: z.string() })

export const DELETE = errorHandler(
  authorize(
    requireAuth(requirePermission('session.terminate', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = TerminateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { jwtToken } = parsed.data
      await prisma.session.deleteMany({ where: { jwtToken } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('SESSION_REVOKED', undefined, { jwtToken, revokedBy: ctx.user.id }, ipAddress, userAgent)
      return NextResponse.json({ ok: true })
    }))
  )
)

// Bulk revoke: POST { action: 'revokeAll', userId?: string, confirm?: boolean }
const BulkSchema = z.object({ action: z.literal('revokeAll'), userId: z.string().optional(), confirm: z.boolean().optional() })

export const POST = errorHandler(
  authorize(
    requireAuth(requirePermission('session.terminate', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = BulkSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { userId, confirm } = parsed.data
      const { ipAddress, userAgent } = getRequestMetadata(req)
      if (userId) {
        // revoke all sessions for user
        await prisma.session.deleteMany({ where: { userId } })
        await logAuditEvent('SESSION_REVOKED', userId, { scope: 'user', revokedBy: ctx.user.id }, ipAddress, userAgent)
        return NextResponse.json({ ok: true, message: 'All sessions revoked for user' })
      }
      // global revoke requires explicit confirm=true
      if (!confirm) return NextResponse.json({ message: 'Confirmation required for global revoke' }, { status: 400 })
      await prisma.session.deleteMany({})
      await logAuditEvent('SESSION_REVOKED', undefined, { scope: 'global', revokedBy: ctx.user.id }, ipAddress, userAgent)
      return NextResponse.json({ ok: true, message: 'All sessions revoked (global)' })
    }))
  )
)
