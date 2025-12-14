import prisma from '@/services/prismaService'

export async function getRoles() {
  return prisma.role.findMany({ where: { deletedAt: null } })
}

export async function getUserRoles(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: true } } }
  })
  return (user?.roles || []).map((ur) => ur.role)
}

export async function assignRole(userId: string, roleName: string) {
  const role = await prisma.role.findUnique({ where: { name: roleName } })
  if (!role) throw new Error('Role not found')
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id }
  })
  return true
}

export async function removeRole(userId: string, roleName: string) {
  const role = await prisma.role.findUnique({ where: { name: roleName } })
  if (!role) throw new Error('Role not found')
  await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId: role.id } } })
  return true
}
