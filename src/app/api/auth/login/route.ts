// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authz = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authz?.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authz.slice("Bearer ".length).trim();
    const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: true,
      maxAge: expiresIn / 1000,
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (err) {
    console.error("Session login error:", err);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
