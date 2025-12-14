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

const CreateRole = z.object({ name: z.string().min(1), description: z.string().optional() })
const UpdateRole = z.object({ id: z.string(), name: z.string().min(1).optional(), description: z.string().optional() })
const AssignPerm = z.object({ roleId: z.string(), permissionId: z.string() })

export const GET = errorHandler(
  authorize(
    requireAuth(requirePermission('role.read', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const roleId = url.searchParams.get('roleId')
      if (!roleId) {
        const roles = await prisma.role.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } })
        return NextResponse.json({ ok: true, roles })
      }
      const role = await prisma.role.findUnique({ where: { id: roleId }, include: { permissions: { include: { permission: true } }, users: { include: { user: true } } } })
      if (!role) return NextResponse.json({ message: 'Role not found' }, { status: 404 })
      return NextResponse.json({ ok: true, role })
    }))
  )
)

export const POST = errorHandler(
  authorize(
    requireAuth(requirePermission('role.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = CreateRole.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { name, description } = parsed.data
      const existing = await prisma.role.findUnique({ where: { name } })
      if (existing) return NextResponse.json({ message: 'Role exists' }, { status: 409 })
      const r = await prisma.role.create({ data: { name, description } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('ROLE_CHANGED', ctx.user.id, { op: 'create', roleId: r.id, name }, ipAddress, userAgent)
      return NextResponse.json({ ok: true, role: r })
    }))
  )
)

export const PATCH = errorHandler(
  authorize(
    requireAuth(requirePermission('role.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = UpdateRole.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { id, name, description } = parsed.data
      const r = await prisma.role.update({ where: { id }, data: { name: name ?? undefined, description: description ?? undefined } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('ROLE_CHANGED', ctx.user.id, { op: 'update', roleId: id }, ipAddress, userAgent)
      return NextResponse.json({ ok: true, role: r })
    }))
  )
)

export const DELETE = errorHandler(
  authorize(
    requireAuth(requirePermission('role.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const id = url.searchParams.get('id')
      if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })
      await prisma.role.update({ where: { id }, data: { deletedAt: new Date() } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('ROLE_CHANGED', ctx.user.id, { op: 'delete', roleId: id }, ipAddress, userAgent)
      return NextResponse.json({ ok: true })
    }))
  )
)

// Assign / remove permission to role
export const PUT = errorHandler(
  authorize(
    requireAuth(requirePermission('role.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = AssignPerm.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { roleId, permissionId } = parsed.data
      const existing = await prisma.rolePermission.findUnique({ where: { roleId_permissionId: { roleId, permissionId } } })
      if (existing) return NextResponse.json({ message: 'Permission already assigned' }, { status: 409 })
      await prisma.rolePermission.create({ data: { roleId, permissionId } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('PERMISSION_CHANGED', ctx.user.id, { op: 'assign', roleId, permissionId }, ipAddress, userAgent)
      return NextResponse.json({ ok: true })
    }))
  )
)

