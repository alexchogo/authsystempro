import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { logAuditEvent } from '@/lib/auditLog'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  try {
    // Minimal idempotent seed: ensure core permissions and roles exist and role.manage assigned
    const permissions = [
      'session.read','session.read.own','session.read.all','session.write','session.terminate','session.terminate.own','session.terminate.all',
      'user.read','user.read.own','user.read.all','user.create','user.update','user.update.own','user.delete','user.assign-role','user.view-sensitive','user.impersonate','user.lock','user.export',
      'role.read','role.create','role.update','role.delete','role.manage','permission.read','permission.assign','permission.manage','audit.read',
    ]

    for (const name of permissions) {
      await prisma.permission.upsert({ where: { name }, update: {}, create: { name } })
    }

    const roles = ['SUPER_ADMIN','ADMIN','SECURITY_ADMIN','MANAGER','MODERATOR','EDITOR','SUPPORT','CONTRIBUTOR','USER','GUEST']
    for (const name of roles) {
      await prisma.role.upsert({ where: { name }, update: {}, create: { name } })
    }

    // ensure ADMIN has role.manage
    const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
    const perm = await prisma.permission.findUnique({ where: { name: 'role.manage' } })
    if (adminRole && perm) {
      await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } }, update: {}, create: { roleId: adminRole.id, permissionId: perm.id } })
    }

    await logAuditEvent('SEED_RUN', undefined, { note: 'seed run via admin UI' })
    return NextResponse.json({ ok: true })
  } catch (err:any) {
    console.error('seed run failed', err)
    return NextResponse.json({ ok: false, message: err?.message || 'error' }, { status: 500 })
  }
}
