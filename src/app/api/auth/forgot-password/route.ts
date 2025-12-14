import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { rateLimit } from '@/lib/rateLimit'
import { generateResetTokenAndStore } from '@/lib/tokens'
import { sendResetEmail } from '@/lib/send'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'

export const runtime = 'nodejs' // Ensure Node.js runtime for Nodemailer SMTP

const Body = z.object({ email: z.string().email() })


export const POST = errorHandler(async (req: Request) => {
await rateLimit(req, 'forgot_password')
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
if (!user) return NextResponse.json({ ok: true }) // don't reveal


const token = await generateResetTokenAndStore(user.id)
await sendResetEmail(user.email, token)
await prisma.auditLog.create({ data: { userId: user.id, action: 'RESET_REQUEST' } })


return NextResponse.json({ ok: true })
})