// src/app/api/admin/whoami/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // Read session cookie from request headers
    // In Next API routes, cookies are in the Cookie header
    const cookieHeader = (req.headers.get("cookie") || "")
      .split(";")
      .map((c) => c.trim());
    const session = cookieHeader.find((c) => c.startsWith("session="))?.split("=")[1];

    if (!session) {
      return NextResponse.json({ ok: false, error: "No session" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);

    return NextResponse.json({
      ok: true,
      uid: decoded.uid,
      email: decoded.email || null,
      isAdmin: decoded.isAdmin === true,
      iat: decoded.iat,
      exp: decoded.exp,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "not authorized" }, { status: 401 });
  }
}
