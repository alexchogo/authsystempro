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

const AssignRoleBody = z.object({ 
  userId: z.string(), 
  roleId: z.string() 
})

// Note: DELETE uses path params; no request body needed

/**
 * POST /api/admin/roles/assign
 * Admin assigns a role to a user
 */
export const POST = errorHandler(
  authorize(
    requireAuth(
      requirePermission('role.assign', async (req: Request) => {
        const ctx = getAuthContext(req)
        if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const parsed = AssignRoleBody.safeParse(body)
        if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })

        const { userId, roleId } = parsed.data
        const { ipAddress, userAgent } = getRequestMetadata(req)

        // Check user and role exist
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

        const role = await prisma.role.findUnique({ where: { id: roleId } })
        if (!role) return NextResponse.json({ message: 'Role not found' }, { status: 404 })

        // Check if user already has role
        const existing = await prisma.userRole.findUnique({
          where: { userId_roleId: { userId, roleId } }
        })

        if (existing) {
          return NextResponse.json({ message: 'User already has this role' }, { status: 409 })
        }

        // Assign role
        await prisma.userRole.create({
          data: { userId, roleId }
        })

        // Log role assignment
        await logAuditEvent(
          'ROLE_ASSIGNED',
          userId,
          { 
            roleId, 
            roleName: role.name, 
            assignedBy: ctx.user.id,
            adminEmail: ctx.user.email
          },
          ipAddress,
          userAgent
        )

        return NextResponse.json({ ok: true, message: `Role ${role.name} assigned` })
      })
    )
  )
)

/**
 * DELETE /api/admin/roles/:userId/:roleId
 * Admin removes a role from a user
 */
export const DELETE = errorHandler(
  authorize(
    requireAuth(
      requirePermission('role.remove', async (req: Request) => {
        const ctx = getAuthContext(req)
        if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        const url = new URL(req.url)
        const parts = url.pathname.split('/')
        const userId = parts[parts.length - 2]
        const roleId = parts[parts.length - 1]

        const { ipAddress, userAgent } = getRequestMetadata(req)

        // Check user and role exist
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

        const role = await prisma.role.findUnique({ where: { id: roleId } })
        if (!role) return NextResponse.json({ message: 'Role not found' }, { status: 404 })

        // Remove role
        await prisma.userRole.delete({
          where: { userId_roleId: { userId, roleId } }
        })

        // Log role removal
        await logAuditEvent(
          'ROLE_REMOVED',
          userId,
          { 
            roleId, 
            roleName: role.name, 
            removedBy: ctx.user.id,
            adminEmail: ctx.user.email
          },
          ipAddress,
          userAgent
        )

        return NextResponse.json({ ok: true, message: `Role ${role.name} removed` })
      })
    )
  )
)
