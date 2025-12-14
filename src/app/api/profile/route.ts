import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requirePermission } from '@/lib/auth/requirePermission'
import { getAuthContext } from '@/lib/auth/context'
import { z } from 'zod'

export const GET = errorHandler(
  authorize(
    requireAuth(async (req: Request) => {
      const ctx = getAuthContext(req)
      if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
      const url = new URL(req.url)
      const targetUserId = url.searchParams.get('userId')

      // Allow SUPER_ADMIN to view any user's profile via ?userId=... or default to current user
      const idToFetch = targetUserId && ctx.roles.includes('SUPER_ADMIN') ? targetUserId : ctx.user.id

      const user = await prisma.user.findUnique({
        where: { id: idToFetch },
        select: { id: true, email: true, fullName: true, username: true, phone: true, emailVerified: true, createdAt: true, deletedAt: true }
      })
      if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })
      return NextResponse.json({ ok: true, user })
    })
  )
)

const PatchSchema = z.object({
  fullName: z.string().min(1).max(120).optional(),
  username: z.string().min(3).max(50).optional(),
  phone: z.string().min(6).max(20).optional(),
})

export const PATCH = errorHandler(
  authorize(
    requireAuth(
      requirePermission('profile.update', async (req: Request) => {
        const ctx = getAuthContext(req)
        if (!ctx?.user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        const body = await req.json().catch(() => ({}))
        const input = PatchSchema.parse(body)
        const updated = await prisma.user.update({
          where: { id: ctx.user.id },
          data: input,
          select: { id: true, email: true, fullName: true, username: true, phone: true }
        })
        return NextResponse.json({ ok: true, user: updated })
      })
    )
  )
)
