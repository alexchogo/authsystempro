import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { z } from 'zod'
import { errorHandler } from '@/lib/errorHandler'
import { authorize } from '@/lib/auth/authorize'
import { requireAuth } from '@/lib/auth/requireAuth'
import { requirePermission } from '@/lib/auth/requirePermission'


const Body = z.object({ token: z.string().optional() })


export const POST = errorHandler(
	authorize(
		requireAuth(
			requirePermission('auth.logout', async (req: Request) => {
				const body = await req.json()
				const parsed = Body.parse(body)
				if (!parsed.token) return NextResponse.json({ ok: true })
				await prisma.session.deleteMany({ where: { jwtToken: parsed.token } })
				return NextResponse.json({ ok: true })
			})
		)
	)
)