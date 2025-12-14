import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { getAuthContext } from '@/lib/auth/context'

export const runtime = 'nodejs'

export const GET = errorHandler(
  authorize(
    requireAuth(async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

      const url = new URL(req.url)
      const exportFlag = url.searchParams.get('export') === '1'

      const logs = await prisma.auditLog.findMany({
        where: { userId: ctx.user.id },
        orderBy: { createdAt: 'desc' },
        take: exportFlag ? 500 : 20,
        select: { id: true, action: true, ipAddress: true, userAgent: true, createdAt: true, metadata: true }
      })

      const fmt = new Intl.DateTimeFormat('en-KE', {
        timeZone: 'Africa/Nairobi',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      const enriched = logs.map((log) => {
        const date = new Date(log.createdAt)
        return {
          ...log,
          dayLabel: fmt.format(date),
          iso: date.toISOString()
        }
      })

      if (exportFlag) {
        await prisma.auditLog.create({
          data: {
            userId: ctx.user.id,
            action: 'AUDIT_EXPORT',
            metadata: { count: logs.length }
          }
        })
      }

      return NextResponse.json({ ok: true, logs: enriched })
    })
  )
)
