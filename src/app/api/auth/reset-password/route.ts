import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { hashPassword } from '@/lib/hash'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'


const Body = z.object({ token: z.string(), password: z.string().min(8) })


export const POST = errorHandler(async (req: Request) => {
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const rt = await prisma.resetToken.findUnique({ where: { token: parsed.data.token } })
if (!rt || rt.expiresAt < new Date() || rt.used) throw ApiError(400, 'Invalid or expired token')


const hashed = await hashPassword(parsed.data.password)
await prisma.user.update({ where: { id: rt.userId }, data: { password: hashed } })
await prisma.resetToken.update({ where: { id: rt.id }, data: { used: true } })
await prisma.auditLog.create({ data: { userId: rt.userId, action: 'RESET_SUCCESS' } })


return NextResponse.json({ ok: true })
})