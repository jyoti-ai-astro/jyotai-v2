// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

// 5 days
const EXPIRES_IN_MS = 5 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    // accept multiple shapes for compatibility
    let sessionCookie: string | undefined =
      body?.sessionCookie || body?.token || req.cookies.get(COOKIE_NAME)?.value;
    const idToken: string | undefined = body?.idToken;

    // If we already have a session cookie, verify it
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      return NextResponse.json({ ok: true, isAdmin: decoded.isAdmin === true });
    }

    // Otherwise create a new session cookie from a fresh ID token
    if (!idToken) {
      return NextResponse.json({ ok: false, error: "no_token" }, { status: 400 });
    }

    const newSession = await adminAuth.createSessionCookie(idToken, {
      expiresIn: EXPIRES_IN_MS,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, newSession, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: EXPIRES_IN_MS / 1000,
      path: "/",
    });
    return res;
  } catch (err: any) {
    const res = NextResponse.json(
      { ok: false, error: err?.errorInfo?.code || err?.message || "verify_failed" },
      { status: 401 }
    );
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
