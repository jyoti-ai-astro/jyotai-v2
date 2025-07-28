import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Only protect routes starting with /admin
  if (!url.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Get the session cookie
  const sessionCookie = req.cookies.get('session')?.value;
  if (!sessionCookie) {
    // Redirect to our new login page if no cookie
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Verify the cookie with the Firebase Admin gods
  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    if (decodedClaims.isAdmin) {
      // If the user is an admin, let them pass
      return NextResponse.next();
    }
  } catch (error) {
    // If cookie is invalid, fall through to redirect
    console.error("Invalid session cookie:", error);
  }

  // If not an admin, banish them to the login page
  url.pathname = '/login';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*'], // This ensures our guard only watches the admin chamber
};