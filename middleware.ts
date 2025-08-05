// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This is the function that will be called for each request
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('__session')?.value;
  const { pathname } = request.nextUrl;

  // If there's no token and the user is trying to access a protected route, redirect to login
  if (!token) {
    // We allow the request to continue if it's for the login page itself
    if (pathname === '/login') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // If the user has a token, we need to verify it
  // We avoid calling our verification API route if the user is already on the login page
  if (pathname === '/login') {
    return NextResponse.next();
  }

  try {
    // Get the absolute URL for the API route
    const verifyUrl = new URL('/api/auth/verify', request.url);

    // Make a request to our verification API route
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    // If verification fails (API returns a non-200 response), redirect to login
    if (!response.ok) {
      console.log('Token verification failed, redirecting to login.');
      const redirectUrl = new URL('/login', request.url);
      
      // Clear the invalid cookie
      const responseWithClearedCookie = NextResponse.redirect(redirectUrl);
      responseWithClearedCookie.cookies.delete('__session');
      return responseWithClearedCookie;
    }

    // If verification is successful, let the user proceed
    return NextResponse.next();

  } catch (error) {
    console.error('Error in middleware while calling verification API:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// This config specifies which paths the middleware should run on.
// This is a crucial performance optimization.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/ (so the middleware doesn't run on the verify route itself)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};