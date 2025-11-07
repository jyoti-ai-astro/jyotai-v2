import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

// Node runtime (firebase-admin)
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json({ status: "error", message: "Unauthorized" }, { status: 401 });
    }

    const idToken = authorization.split("Bearer ")[1].trim();
    // 14 days
    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ status: "success" });
    res.cookies.set({
      name: "session",
      value: sessionCookie,
      httpOnly: true,
      secure: true,
      maxAge: expiresIn / 1000, // seconds
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 });
  }
}
