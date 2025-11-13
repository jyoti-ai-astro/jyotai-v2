// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const h = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!h?.startsWith("Bearer ")) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const idToken = h.slice("Bearer ".length).trim();
    const expiresIn = 14 * 24 * 60 * 60 * 1000; // 14 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ status: "success" });
    // Use __session so it’s readable by middleware if you later protect routes
    res.cookies.set({
      name: "__session",
      value: sessionCookie,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
      maxAge: expiresIn / 1000,
    });
    return res;
  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 });
  }
}
