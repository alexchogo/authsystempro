import { NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'
import { createSessionTokenAndStore } from '@/lib/tokens'
import { z } from 'zod'
import { ApiError } from '@/lib/errors'
import { errorHandler } from '@/lib/errorHandler'
import { getRequestMetadata } from '@/lib/requestUtils'


const Body = z.object({ userId: z.string(), code: z.string() })


export const POST = errorHandler(async (req: Request) => {
const body = await req.json()
const parsed = Body.safeParse(body)
if (!parsed.success) throw ApiError(400, parsed.error.message)


const ok = await verifyOtp(parsed.data.userId, parsed.data.code)
if (!ok) throw ApiError(401, 'Invalid or expired OTP')


const metadata = getRequestMetadata(req)
const jwt = await createSessionTokenAndStore(parsed.data.userId, metadata)
return NextResponse.json({ ok: true, token: jwt })
})