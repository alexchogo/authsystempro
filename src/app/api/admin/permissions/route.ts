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

const CreateSchema = z.object({ name: z.string().min(1), description: z.string().optional() })
const UpdateSchema = z.object({ id: z.string(), name: z.string().min(1).optional(), description: z.string().optional() })

export const GET = errorHandler(
  authorize(
    requireAuth(requirePermission('permission.read', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const q = url.searchParams.get('q') || undefined
      const page = Number(url.searchParams.get('page') || '1')
      const limit = Math.min(200, Number(url.searchParams.get('limit') || '100'))
      const where: any = { deletedAt: null }
      if (q) where.OR = [{ name: { contains: q } }, { description: { contains: q } }]
      const items = await prisma.permission.findMany({ where, orderBy: { name: 'asc' }, skip: (page - 1) * limit, take: limit })
      return NextResponse.json({ ok: true, permissions: items })
    }))
  )
)

export const POST = errorHandler(
  authorize(
    requireAuth(requirePermission('permission.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = CreateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { name, description } = parsed.data
      const existing = await prisma.permission.findUnique({ where: { name } })
      if (existing) return NextResponse.json({ message: 'Permission exists' }, { status: 409 })
      const p = await prisma.permission.create({ data: { name, description } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('PERMISSION_CHANGED', ctx.user.id, { op: 'create', permissionId: p.id, name }, ipAddress, userAgent)
      return NextResponse.json({ ok: true, permission: p })
    }))
  )
)

export const PATCH = errorHandler(
  authorize(
    requireAuth(requirePermission('permission.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const body = await req.json().catch(() => ({}))
      const parsed = UpdateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ message: parsed.error.message }, { status: 400 })
      const { id, name, description } = parsed.data
      const p = await prisma.permission.update({ where: { id }, data: { name: name ?? undefined, description: description ?? undefined } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('PERMISSION_CHANGED', ctx.user.id, { op: 'update', permissionId: id }, ipAddress, userAgent)
      return NextResponse.json({ ok: true, permission: p })
    }))
  )
)

export const DELETE = errorHandler(
  authorize(
    requireAuth(requirePermission('permission.manage', async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const id = url.searchParams.get('id')
      if (!id) return NextResponse.json({ message: 'Missing id' }, { status: 400 })
      await prisma.permission.update({ where: { id }, data: { deletedAt: new Date() } })
      const { ipAddress, userAgent } = getRequestMetadata(req)
      await logAuditEvent('PERMISSION_CHANGED', ctx.user.id, { op: 'delete', permissionId: id }, ipAddress, userAgent)
      return NextResponse.json({ ok: true })
    }))
  )
)
