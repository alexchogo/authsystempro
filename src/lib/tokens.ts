import prisma from '@/services/prismaService'
import { randomBytes } from 'crypto'
import { classifyUserAgent } from './requestUtils'


function randomHex(len=48){ return randomBytes(len/2).toString('hex') }


export async function generateVerificationTokenAndStore(userId:string){
const token = randomHex(48)
await prisma.verificationToken.create({ data: { token, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24) } })
return token
}


export async function generateResetTokenAndStore(userId:string){
const token = randomHex(48)
await prisma.resetToken.create({ data: { token, userId, expiresAt: new Date(Date.now() + 1000 * 60 * 60), used: false } })
return token
}


export async function createSessionTokenAndStore(
	userId: string,
	metadata?: { ipAddress?: string; userAgent?: string; device?: { os: string; browser: string; deviceType: string } }
){
	const token = randomHex(64)
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
	const device = metadata?.device ?? classifyUserAgent(metadata?.userAgent)
	const metaJson = { ipAddress: metadata?.ipAddress, userAgent: metadata?.userAgent, device }
	await prisma.session.create({ data: { userId, jwtToken: token, expiresAt, ipAddress: metadata?.ipAddress, userAgent: metadata?.userAgent, metadata: metaJson } })
	return token
}