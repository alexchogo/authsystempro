import type { NextRequest } from 'next/server'
import type { User as PrismaUser } from '@/generated/prisma'

export type AuthContext = {
  user: PrismaUser | null
  roles: string[]
  permissions: Set<string>
}

const authContextMap = new WeakMap<Request | NextRequest, AuthContext>()

export function setAuthContext(req: Request | NextRequest, ctx: AuthContext) {
  authContextMap.set(req, ctx)
}

export function getAuthContext(req: Request | NextRequest): AuthContext | null {
  return authContextMap.get(req) || null
}

export function hasPermissionInContext(req: Request | NextRequest, key: string): boolean {
  const ctx = getAuthContext(req)
  if (!ctx || !ctx.user) return false
  if (ctx.roles.includes('SUPER_ADMIN')) return true
  return ctx.permissions.has(key)
}
