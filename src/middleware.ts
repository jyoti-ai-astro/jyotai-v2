// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // Log to verify it actually runs (you'll see this in Vercel function logs)
  console.log('🛡️ middleware hit at:', req.nextUrl.pathname);

  // Only protect /admin
  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const session = req.cookies.get('session')?.value;

  if (!session) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // (Optional) You can do a *very* light, purely string-based claim check here
  // but don't verify with firebase-admin in middleware (edge runtime can't).
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
