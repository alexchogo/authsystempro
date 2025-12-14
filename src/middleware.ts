import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get auth token from cookies or localStorage (client-side)
  const authToken = request.cookies.get('authToken')?.value

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  
  // Auth routes that should redirect to dashboard if already authenticated
  const authRoutes = ['/authpage/signin', '/authpage/signup', '/authpage/forgot', '/authpage/otp']
  
  // Public auth routes (no redirect needed)
  const publicAuthRoutes = ['/authpage/verify-email', '/authpage/reset-password']

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // Check if current path is a public auth route (like verify-email, reset-password)
  const isPublicAuthRoute = publicAuthRoutes.some(route => pathname.startsWith(route))

  // Redirect to signin if accessing protected route without token
  if (isProtectedRoute && !authToken) {
    const url = new URL('/authpage/signin', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if accessing auth routes with valid token (but not public auth routes)
  if (isAuthRoute && authToken && !isPublicAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
}
