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

const Body = z.object({ action: z.enum(['assign','remove']), roleId: z.string(), permissionId: z.string() })

export const POST = errorHandler(
  authorize(
    requireAuth(requirePermission('role.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = Body.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { action, roleId, permissionId } = parsed.data
      const { ipAddress, userAgent } = getRequestMetadata(req)

      if (action === 'assign') {
        const existing = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId, permissionId } } })
        if (existing) return NextResponse.json({ message: 'Already assigned' }, { status: 409 })
        await prisma.rolePermission.create({ data: { roleId, permissionId } })
        await logAuditEvent('PERMISSION_CHANGED', ctx.user.id, { op: 'assign', roleId, permissionId }, ipAddress, userAgent)
        return NextResponse.json({ ok: true })
      }

      // remove
      await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } })
      await logAuditEvent('PERMISSION_CHANGED', ctx.user.id, { op: 'remove', roleId, permissionId }, ipAddress, userAgent)
      return NextResponse.json({ ok: true })
    }))
  )
)
