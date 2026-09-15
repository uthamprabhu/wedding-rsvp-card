import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ADMIN_SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

/**
 * Verify admin password against environment variable
 * NEVER expose this on client side
 */
export function verifyAdminPassword(password: string): boolean {
  const correctPassword = process.env.ADMIN_PASSWORD;
  if (!correctPassword) {
    throw new Error('ADMIN_PASSWORD not configured');
  }
  return password === correctPassword;
}

/**
 * Create secure admin session cookie
 * HttpOnly: prevents client-side JavaScript access
 * Secure: only sent over HTTPS (except localhost)
 * SameSite: CSRF protection
 */
export async function createAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = generateSecureToken();
  
  cookieStore.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Check if valid admin session exists
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  return !!session?.value;
}

/**
 * Clear admin session (logout)
 */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

/**
 * Middleware helper to validate session
 */
export function validateAdminSession(request: NextRequest): boolean {
  const session = request.cookies.get(ADMIN_SESSION_COOKIE);
  return !!session?.value;
}

/**
 * Generate cryptographically secure random token
 */
function generateSecureToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Redirect helper for middleware
 */
export function redirectToLogin(request: NextRequest): NextResponse {
  const url = new URL('/admin', request.url);
  return NextResponse.redirect(url);
}
