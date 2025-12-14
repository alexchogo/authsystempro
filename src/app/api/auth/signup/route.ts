import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { hashPassword } from '@/lib/hash'
import { generateVerificationTokenAndStore } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/send'
import { rateLimit } from '@/lib/rateLimit'
import { getRequestMetadata } from '@/lib/requestUtils'
import { logAuditEvent } from '@/lib/auditLog'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'

export const runtime = 'nodejs' // Ensure Node.js runtime for Nodemailer SMTP

const SignupBody = z.object({
email: z.string().email(),
password: z.string().min(8),
fullName: z.string().min(1),
username: z.string().min(3),
phone: z.string().min(6),
})


export const POST = errorHandler(async (req: Request) => {
await rateLimit(req, 'signup')
const body = await req.json()
const parsed = SignupBody.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const { email, password, fullName, username, phone } = parsed.data


const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }, { phone }] } })
if (existing) throw ApiError(409, 'User with provided email/username/phone already exists')


const hashed = await hashPassword(password)
const { ipAddress, userAgent, device } = getRequestMetadata(req)
const user = await prisma.user.create({ data: { email, password: hashed, fullName, username, phone } })

await logAuditEvent('SIGNUP', user.id, {
	email,
	device: device.os,
	browser: device.browser,
	deviceType: device.deviceType
}, ipAddress, userAgent)

const token = await generateVerificationTokenAndStore(user.id)
await sendVerificationEmail(user.email, token)


return NextResponse.json({ ok: true, userId: user.id })
})