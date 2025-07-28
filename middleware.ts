import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * Global gatekeeper for all `/admin/*` routes.
 * - If there is NO `session` cookie → redirect to /login
 * - If there IS a cookie but it's invalid or not admin → redirect to /login
 * - If valid & isAdmin → let them in
 *
 * Debug logs are included so you can see exactly what happens in Vercel / local logs.
 */
export async function middleware(req: NextRequest) {
  // Debug: prove the middleware is actually firing
  console.log('🛡️ Middleware triggered at:', req.nextUrl.pathname);

  const url = req.nextUrl.clone();

  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    console.log('➡️ Not an /admin route, letting it pass');
    return NextResponse.next();
  }

  // Look for the session cookie that we set in /api/auth/login
  const sessionCookie = req.cookies.get('session')?.value;
  console.log('🔑 Has session cookie?', !!sessionCookie);

  if (!sessionCookie) {
    console.log('⛔ No cookie → redirecting to /login');
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    // Validate cookie with Firebase Admin
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    console.log('✅ Cookie valid. isAdmin:', !!decodedClaims.isAdmin);

    if (decodedClaims.isAdmin) {
      // High Priest confirmed — allow access
      return NextResponse.next();
    }
  } catch (error) {
    console.error('❌ Invalid session cookie:', error);
  }

  // If we reach here, the user is not an admin (or cookie invalid)
  console.log('🚫 Not admin → redirecting to /login');
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

// Tell Next.js which paths this middleware should run on
export const config = {
  matcher: ['/admin/:path*'],
};
