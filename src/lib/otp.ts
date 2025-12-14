import prisma from '@/services/prismaService'
import type { Prisma } from '@/generated/prisma'
import { sendOtpEmail } from './send'
import { logAuditEvent } from './auditLog'


const EAT_OFFSET_MINUTES = 3 * 60

function nowInEAT(): Date {
	const now = new Date()
	const shiftMinutes = EAT_OFFSET_MINUTES + now.getTimezoneOffset()
	return new Date(now.getTime() + shiftMinutes * 60 * 1000)
}


export async function createOtpForUser(userId: string, meta: Prisma.InputJsonValue = {}) {
const code = Math.floor(100000 + Math.random() * 900000).toString()
const now = nowInEAT()
const expiresAt = new Date(now.getTime() + 1000 * 60 * 10)
await prisma.otpCode.upsert({ where: { userId }, update: { code, expiresAt, attempts: 0, metadata: meta }, create: { userId, code, expiresAt, metadata: meta } })
const user = await prisma.user.findUnique({ where: { id: userId } })
if (user) await sendOtpEmail(user.email, code)
// Log OTP events; mark sensitive when purpose indicates
const metaObj = (meta && typeof meta === 'object') ? meta as Record<string, unknown> : {}
const isSensitive = (metaObj as { purpose?: string }).purpose === 'email_change'
await logAuditEvent(isSensitive ? 'OTP_SENSITIVE' : 'OTP_SENT', userId, { ...metaObj, purpose: (metaObj as { purpose?: string }).purpose ?? 'signin', expiresAt })
return code
}


export async function verifyOtp(userId:string, code:string){
const otp = await prisma.otpCode.findUnique({ where: { userId } })
if (!otp) return false
if (otp.expiresAt < nowInEAT()) return false
if (otp.attempts >= 5) return false
if (otp.code !== code){ await prisma.otpCode.update({ where: { userId }, data: { attempts: { increment: 1 } } }); return false }
await prisma.otpCode.delete({ where: { userId } })
await prisma.auditLog.create({ data: { userId, action: 'OTP_VERIFIED' } })
return true
}