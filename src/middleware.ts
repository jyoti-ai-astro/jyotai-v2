// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const host = req.headers.get("host") || "";
  const pathname = url.pathname;

  // --- 1) Canonical host: force www on the apex domain
  if (host === "jyoti.app") {
    url.host = "www.jyoti.app";
    return NextResponse.redirect(url, 308);
  }

  // --- 2) Admin guard (uses the same cookie name set in /api/auth/login)
  if (pathname.startsWith("/admin")) {
    const session = req.cookies.get("session")?.value; // <-- align with /api/auth/login
    if (!session) {
      const r = NextResponse.redirect(new URL("/login", req.url));
      r.cookies.delete("session");
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
        r.cookies.delete("session");
        return r;
      }
    } catch {
      const r = NextResponse.redirect(new URL("/login", req.url));
      r.cookies.delete("session");
      return r;
    }
  }

  return NextResponse.next();
}

// Apply to all routes (for host redirect), but skip static assets/_next
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
