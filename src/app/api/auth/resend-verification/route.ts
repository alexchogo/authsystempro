import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { rateLimit } from '@/lib/rateLimit'
import { generateVerificationTokenAndStore } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/send'
import { errorHandler } from '@/lib/errorHandler'

export const runtime = 'nodejs' // Ensure Node.js runtime for Nodemailer SMTP

const Body = z.object({ email: z.string().email() })


export const POST = errorHandler(async (req: Request) => {
await rateLimit(req, 'resend_verification')
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
if (!user) return NextResponse.json({ ok: true }) // don't reveal
if (user.emailVerified) return NextResponse.json({ ok: true, message: 'Already verified' })


const token = await generateVerificationTokenAndStore(user.id)
await sendVerificationEmail(user.email, token)
await prisma.auditLog.create({ data: { userId: user.id, action: 'OTP_RESENT' } })


return NextResponse.json({ ok: true })
})