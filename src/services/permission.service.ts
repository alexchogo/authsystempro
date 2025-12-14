import prisma from '@/services/prismaService'

export async function getPermissions() {
  return prisma.permission.findMany({ where: { deletedAt: null } })
}

export async function getUserPermissionKeys(userId: string): Promise<Set<string>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: { permissions: { include: { permission: true } } }
          }
        }
      }
    }
  })
  const keys = new Set<string>()
  for (const ur of user?.roles || []) {
    for (const rp of ur.role.permissions) {
      keys.add(rp.permission.name)
    }
  }
  return keys
}

export async function hasPermission(userId: string, key: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  })
  const roles = (user?.roles || []).map((ur) => ur.role.name)
  if (roles.includes('SUPER_ADMIN')) return true
  const keys = await getUserPermissionKeys(userId)
  return keys.has(key)
}
