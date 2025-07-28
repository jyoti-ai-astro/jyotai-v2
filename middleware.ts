import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // The guardian only watches the /admin chamber
  if (!url.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get('session')?.value;
  if (!sessionCookie) {
    // If the pilgrim has no key, send them to the login chamber
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    // The guardian asks the Firebase gods to verify the key
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedClaims.isAdmin) {
      // The pilgrim is the High Priest. Let them pass.
      return NextResponse.next();
    }
  } catch (error) {
    // The key is a forgery. Banish them.
    console.error("Invalid session cookie:", error);
  }

  // If they are not the High Priest, banish them to the login chamber
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'], // The guardian's official post
};