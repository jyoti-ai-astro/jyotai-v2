import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge Runtime-safe middleware.
 * - Only runs on `/admin/*` routes
 * - Checks for `session` cookie (standardized)
 * - Delegates verification to `/api/auth/verify` (Node runtime)
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const verifyURL = new URL("/api/auth/verify", req.url);
    const response = await fetch(verifyURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.get("cookie") || "",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const result = await response.json();
    if (!result.ok || result.isAdmin !== true) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  } catch (err) {
    console.error("🔥 Middleware error:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
