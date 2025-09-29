import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, we'll handle authentication client-side
  // This middleware will only redirect to auth page for API routes protection
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isApiAuth = request.nextUrl.pathname.startsWith('/api/auth')
  const isPublicPage = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/api')

  // Allow API auth routes and auth page to pass through
  if (isApiAuth || isAuthPage) {
    return NextResponse.next()
  }

  // Allow public pages to pass through (they'll handle auth client-side)
  if (isPublicPage) {
    return NextResponse.next()
  }

  // For now, let all other routes through
  // Authentication will be handled client-side in the components
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
