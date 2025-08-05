// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global gatekeeper for all `/admin/*` routes — Edge-compatible version.
 * - Checks for `__session` cookie (set after login)
 * - Calls `/api/auth/verify` (Node.js API route) to validate token
 * - Redirects to `/login` if invalid or missing
 */
export async function middleware(req: NextRequest) {
  console.log('🛡️ [middleware] Triggered at:', req.nextUrl.pathname);

  const url = req.nextUrl.clone();

  // Only protect /admin routes
  if (!url.pathname.startsWith('/admin')) {
    console.log('➡️ [middleware] Not an /admin route, letting it pass');
    return NextResponse.next();
  }

  const token = req.cookies.get('__session')?.value;
  console.log('🔑 [middleware] Has __session cookie?', !!token);

  if (!token) {
    console.log('⛔ [middleware] No token → redirecting to /login');
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const verifyUrl = new URL('/api/auth/verify', req.url);

    const res = await fetch(verifyUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      console.log('🚫 [middleware] Token invalid → redirecting to /login');
      const redirect = NextResponse.redirect(new URL('/login', req.url));
      redirect.cookies.delete('__session');
      return redirect;
    }

    console.log('✅ [middleware] Token valid → allowing access');
    return NextResponse.next();
  } catch (err) {
    console.error('🔥 [middleware] Error during verification:', err);
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
}

// Tell Next.js which paths this middleware should run on
export const config = {
  matcher: ['/admin/:path*'],
};
