import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession, redirectToLogin } from '@/lib/admin-auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin/dashboard and any sub-routes
  if (pathname.startsWith('/admin/dashboard')) {
    const isAuthenticated = validateAdminSession(request);
    
    if (!isAuthenticated) {
      return redirectToLogin(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/dashboard/:path*',
  ],
};
