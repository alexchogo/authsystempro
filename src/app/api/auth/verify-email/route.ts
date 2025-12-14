import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { getRequestMetadata } from '@/lib/requestUtils'
import { logAuditEvent } from '@/lib/auditLog'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'


const Body = z.object({ token: z.string() })


export const POST = errorHandler(async (req: Request) => {
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const vt = await prisma.verificationToken.findUnique({ where: { token: parsed.data.token } })
if (!vt || vt.expiresAt < new Date()) {
	if (vt) {
		const { ipAddress, userAgent } = getRequestMetadata(req)
		await logAuditEvent('EMAIL_VERIFICATION_FAILED', vt.userId, { reason: 'expired_token' }, ipAddress, userAgent)
	}
	throw ApiError(400, 'Invalid or expired token')
}

const { ipAddress, userAgent } = getRequestMetadata(req)
await prisma.user.update({ where: { id: vt.userId }, data: { emailVerified: true } })
await prisma.verificationToken.deleteMany({ where: { userId: vt.userId } })

await logAuditEvent('EMAIL_VERIFIED', vt.userId, { token: vt.token }, ipAddress, userAgent)


return NextResponse.json({ ok: true })
})