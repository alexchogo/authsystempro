import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getAuthContext } from '@/lib/auth/context'
import { getRequestMetadata } from '@/lib/requestUtils'
import { logAuditEvent } from '@/lib/auditLog'
import { z } from 'zod'

export const runtime = 'nodejs'

const ActionBody = z.object({ action: z.enum(['deactivate', 'reactivate', 'delete']), reason: z.string().optional() })

/**
 * POST /api/account/manage
 * - deactivate: Soft-delete user account (set deletedAt)
 * - reactivate: Restore soft-deleted account
 * - delete: Schedule or perform permanent deletion
 */
export const POST = errorHandler(
  authorize(
    requireAuth(async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

      const body = await req.json()
      const parsed = ActionBody.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })

      const { action, reason = 'User-initiated' } = parsed.data
      const { ipAddress, userAgent } = getRequestMetadata(req)

      try {
        if (action === 'deactivate') {
          // Soft-delete: set deletedAt to current time
          await prisma.user.update({
            where: { id: ctx.user.id },
            data: { deletedAt: new Date() }
          })

          await logAuditEvent(
            'ACCOUNT_DEACTIVATED',
            ctx.user.id,
            { reason, type: 'user_initiated' },
            ipAddress,
            userAgent
          )

          return NextResponse.json({ ok: true, message: 'Account deactivated' })
        } else if (action === 'reactivate') {
          // Restore: clear deletedAt
          const user = await prisma.user.update({
            where: { id: ctx.user.id },
            data: { deletedAt: null }
          })

          await logAuditEvent(
            'ACCOUNT_REACTIVATED',
            ctx.user.id,
            { reason, type: 'user_initiated' },
            ipAddress,
            userAgent
          )

          return NextResponse.json({ ok: true, message: 'Account reactivated', user: { id: user.id, email: user.email } })
        } else if (action === 'delete') {
          // Permanent deletion: remove user and all related data
          // Cascade handled by database relationships
          await logAuditEvent(
            'ACCOUNT_DELETED',
            ctx.user.id,
            { reason, type: 'user_initiated', email: ctx.user.email },
            ipAddress,
            userAgent
          )

          await prisma.user.delete({
            where: { id: ctx.user.id }
          })

          return NextResponse.json({ ok: true, message: 'Account permanently deleted' })
        }

        return NextResponse.json({ message: 'Unsupported action' }, { status: 400 })
      } catch (err) {
        console.error(`[Account] ${action} failed:`, err)
        return NextResponse.json({ message: `Failed to ${action} account` }, { status: 500 })
      }
    })
  )
)
