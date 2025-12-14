import { NextResponse } from 'next/server'
import { getAuthContext } from './context'

export function requirePermission<T extends (req: Request) => Promise<NextResponse>>(permissionKey: string, handler: T) {
  return async (req: Request) => {
    const ctx = getAuthContext(req)
    if (!ctx || !ctx.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    if (ctx.roles.includes('SUPER_ADMIN')) {
      return handler(req)
    }
    if (!ctx.permissions.has(permissionKey)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    return handler(req)
  }
}
