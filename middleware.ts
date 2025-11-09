// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = req.cookies.get("__session")?.value;
  if (!session) {
    const r = NextResponse.redirect(new URL("/login", req.url));
    r.cookies.delete("__session");
    return r;
  }

  try {
    const verifyURL = new URL("/api/auth/verify", req.url);
    const resp = await fetch(verifyURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionCookie: session }),
    });

    if (!resp.ok) {
      const r = NextResponse.redirect(new URL("/login", req.url));
      r.cookies.delete("__session");
      return r;
    }
    return NextResponse.next();
  } catch {
    const r = NextResponse.redirect(new URL("/login", req.url));
    r.cookies.delete("__session");
    return r;
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
