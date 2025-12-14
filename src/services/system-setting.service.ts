import prisma from '@/services/prismaService'
import { hasPermission } from './permission.service'
import type { Prisma } from '@/generated/prisma'

export async function getSystemSetting(userId: string, key: string) {
  const allowed = await hasPermission(userId, 'system.read')
  if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 })
  return prisma.systemSetting.findUnique({ where: { key } })
}

export async function updateSystemSetting(userId: string, key: string, value: Prisma.InputJsonValue) {
  const allowed = await hasPermission(userId, 'system.update')
  if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 })
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  })
}

export async function resetSystemSetting(userId: string, key: string) {
  const allowed = await hasPermission(userId, 'system.reset')
  if (!allowed) throw Object.assign(new Error('Forbidden'), { status: 403 })
  await prisma.systemSetting.deleteMany({ where: { key } })
  return true
}
