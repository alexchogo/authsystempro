import prisma from '@/services/prismaService'
import type { Prisma } from '@/generated/prisma'

export async function logAuditEvent(
  action: Prisma.AuditAction,
  userId?: string,
  metadata: Prisma.InputJsonValue = {},
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        ipAddress,
        userAgent,
        metadata: metadata ?? null
      }
    })
  } catch (err) {
    console.error('[AuditLog] Failed to log event:', action, err)
  }
}
