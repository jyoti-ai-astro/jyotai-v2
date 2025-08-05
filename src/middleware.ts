import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get('__session')?.value;

  if (!req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  if (!sessionCookie) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { initializeApp, applicationDefault } = await import('firebase-admin/app');
    const { getAuth } = await import('firebase-admin/auth');

    // Avoid initializing multiple times
    const app = initializeApp({ credential: applicationDefault() });
    const auth = getAuth(app);
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);

    // Final gate: Must have isAdmin flag
    if (!decodedClaims.isAdmin) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch (err) {
    console.error("🔥 Admin Middleware Error:", err);
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
