// src/middleware.ts

import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge Runtime-safe middleware.
 * - Only runs on `/admin/*` routes
 * - Checks for `__session` cookie
 * - Delegates verification to `/api/auth/verify` (Node runtime)
 */
export async function middleware(req: NextRequest) {
  console.log("🛡️ middleware.ts: Triggered");

  const token = req.cookies.get("__session")?.value;
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  if (!token) {
    console.log("⛔ No token → redirecting to /login");
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const verifyURL = new URL("/api/auth/verify", req.url);
    const response = await fetch(verifyURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      console.log("⛔ Invalid token → redirecting");
      const redirect = NextResponse.redirect(new URL("/login", req.url));
      redirect.cookies.delete("__session");
      return redirect;
    }

    console.log("✅ Token verified");
    return NextResponse.next();
  } catch (err) {
    console.error("🔥 Middleware error:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
