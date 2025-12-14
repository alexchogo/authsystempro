import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { setAuthContext } from './context'

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';').map((p) => p.trim())
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) return decodeURIComponent(part.substring(name.length + 1))
  }
  return null
}

export function requireAuth<T extends (req: Request) => Promise<NextResponse>>(handler: T) {
  return async (req: Request) => {
    const cookieHeader = req.headers.get('cookie')
    const authToken = parseCookie(cookieHeader, 'authToken')

    if (!authToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const session = await prisma.session.findUnique({ where: { jwtToken: authToken } })
    if (!session || session.expiresAt < new Date()) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const roles = (user.roles || []).map((ur) => ur.role.name)
    const permissionNames = new Set<string>()
    for (const ur of user.roles || []) {
      for (const rp of ur.role.permissions) {
        permissionNames.add(rp.permission.name)
      }
    }

    setAuthContext(req, { user, roles, permissions: permissionNames })
    return handler(req)
  }
}
