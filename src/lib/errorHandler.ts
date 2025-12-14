import { NextResponse } from 'next/server'
import prisma from '@/services/prismaService'
import { logAuditEvent } from './auditLog'
import { getRequestMetadata } from './requestUtils'

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null
  const parts = cookieHeader.split(';').map((p) => p.trim())
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) return decodeURIComponent(part.substring(name.length + 1))
  }
  return null
}

export function errorHandler(handler: (req: Request) => Promise<NextResponse>) {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error: unknown) {
      console.error('API Error:', error)
      // Attempt to log system error with request metadata and user context if available
      try {
        const { ipAddress, userAgent } = getRequestMetadata(req)
        const cookieHeader = req.headers.get('cookie')
        const authToken = parseCookie(cookieHeader, 'authToken')
        let userId: string | undefined
        if (authToken) {
          const session = await prisma.session.findUnique({ where: { jwtToken: authToken }, select: { userId: true } })
          userId = session?.userId
        }
        await logAuditEvent('SYSTEM_ERROR', userId, {
          path: req.url,
          method: (req as any).method ?? 'UNKNOWN',
          message: error instanceof Error ? error.message : 'Unknown error'
        }, ipAddress ?? undefined, userAgent ?? undefined)
      } catch (logErr) {
        console.error('[AuditLog] Failed to log system error', logErr)
      }
      
      // Handle custom API errors with status
      if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
        return NextResponse.json(
          { message: (error as { message: string }).message },
          { status: (error as { status: number }).status }
        )
      }
      
      // Handle standard errors
      if (error instanceof Error) {
        return NextResponse.json(
          { message: error.message },
          { status: 500 }
        )
      }
      
      // Handle unknown errors
      return NextResponse.json(
        { message: 'An unexpected error occurred' },
        { status: 500 }
      )
    }
  }
}
