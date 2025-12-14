import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'


const Body = z.object({ token: z.string() })


export const POST = errorHandler(async (req: Request) => {
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const rt = await prisma.resetToken.findUnique({ where: { token: parsed.data.token } })
if (!rt || rt.expiresAt < new Date() || rt.used) throw ApiError(400, 'Invalid or expired token')


return NextResponse.json({ ok: true, userId: rt.userId })
})