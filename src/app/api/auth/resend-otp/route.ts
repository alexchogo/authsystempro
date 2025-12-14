import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { rateLimit } from '@/lib/rateLimit'
import { createOtpForUser } from '@/lib/otp'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'

export const runtime = 'nodejs' // Ensure Node.js runtime for Nodemailer SMTP

const Body = z.object({ userId: z.string() })


export const POST = errorHandler(async (req: Request) => {
await rateLimit(req, 'resend_otp')
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
if (!user) throw ApiError(404, 'User not found')


await createOtpForUser(user.id, { purpose: 'resend' })
return NextResponse.json({ ok: true })
})