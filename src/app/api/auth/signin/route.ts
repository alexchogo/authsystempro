import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { verifyPassword } from '@/lib/hash'
import { createOtpForUser } from '@/lib/otp'
import { rateLimit } from '@/lib/rateLimit'
import { ApiError } from '@/lib/errors'
import { z } from 'zod'
import { errorHandler } from '@/lib/errorHandler'
import { getRequestMetadata } from '@/lib/requestUtils'

export const runtime = 'nodejs' // Ensure Node.js runtime for compatibility
const Body = z.object({ email: z.string().email(), password: z.string().min(1) })


export const POST = errorHandler(async (req: Request) => {
await rateLimit(req, 'signin')
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
if (!user) throw ApiError(401, 'Invalid credentials')


const { ipAddress, userAgent } = getRequestMetadata(req)

const ok = await verifyPassword(parsed.data.password, user.password)
if (!ok) {
await prisma.loginAttempt.create({ data: { email: parsed.data.email, success: false, ipAddress, userAgent } })
throw ApiError(401, 'Invalid credentials')
}


// Create and send OTP
await createOtpForUser(user.id, { purpose: 'signin' })
await prisma.loginAttempt.create({ data: { userId: user.id, email: user.email, success: true, ipAddress, userAgent } })


return NextResponse.json({ ok: true, userId: user.id })
})