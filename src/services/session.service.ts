import prisma from '@/services/prismaService'
import { hasPermission } from './permission.service'

export async function listSessions(requestorUserId: string, targetUserId?: string) {
  const allowed = await hasPermission(requestorUserId, 'session.read')
  if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 })
  return prisma.session.findMany({ where: { userId: targetUserId, deletedAt: null } })
}

export async function terminateSession(requestorUserId: string, jwtToken: string) {
  const allowed = await hasPermission(requestorUserId, 'session.terminate')
  if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 })
  await prisma.session.deleteMany({ where: { jwtToken } })
  return true
}

export async function createSessionForUser(requestorUserId: string, userId: string, token: string, expiresAt: Date) {
  const allowed = await hasPermission(requestorUserId, 'session.write')
  if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 })
  return prisma.session.create({ data: { userId, jwtToken: token, expiresAt } })
}
