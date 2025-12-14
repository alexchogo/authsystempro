import prisma from '@/services/prismaService'

export async function logAuditEvent(
  action: string,
  userId?: string,
  metadata: any = {},
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: action as any,
        ipAddress,
        userAgent,
        metadata: metadata ?? null
      }
    })
  } catch (err) {
    console.error('[AuditLog] Failed to log event:', action, err)
  }
}
