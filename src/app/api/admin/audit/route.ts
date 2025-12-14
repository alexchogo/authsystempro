import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requirePermission } from '@/lib/auth/requirePermission'
import { getAuthContext } from '@/lib/auth/context'
import { logAuditEvent } from '@/lib/auditLog'

export const runtime = 'nodejs'

export const GET = errorHandler(
  authorize(
    requireAuth(requirePermission('audit.read', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const userId = url.searchParams.get('userId') || undefined
      const action = url.searchParams.get('action') || undefined
      const page = Number(url.searchParams.get('page') || '1')
      const limit = Math.min(1000, Number(url.searchParams.get('limit') || '100'))
      const from = url.searchParams.get('from') || undefined
      const to = url.searchParams.get('to') || undefined
      const format = url.searchParams.get('format') || 'json'
      const where: any = {}
      if (userId) where.userId = userId
      if (action) where.action = action
      if (from || to) where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)

      const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit })

      // CSV export
      if (format === 'csv') {
        const rows = [['id','userId','action','ipAddress','userAgent','createdAt','metadata']]
        for (const l of logs) {
          rows.push([
            l.id,
            l.userId ?? '',
            l.action,
            l.ipAddress ?? '',
            l.userAgent ?? '',
            l.createdAt.toISOString(),
            JSON.stringify(l.metadata ?? {})
          ])
        }
        const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n')
        await logAuditEvent('AUDIT_EXPORT', ctx.user.id, { format: 'csv', count: logs.length })
        return new NextResponse(csv, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="audit-${Date.now()}.csv"` } })
      }

      return NextResponse.json({ ok: true, logs })
    }))
  )
)
