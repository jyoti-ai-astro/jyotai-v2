// src/app/api/auth/send-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// must run on Node (uses process.env, not Edge)
export const runtime = "nodejs";

/**
 * Returns Firebase Auth actionCodeSettings for client-side Magic Link sending.
 * The email itself is sent by the client via `sendSignInLinkToEmail(...)`.
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    
    const rateLimitResult = rateLimit(`send-link:${ip}`, 5, 60_000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    // Email validation
    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // Prefer explicit base URL; fallback to current origin
    const origin = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;

    const actionCodeSettings = {
      url: `${origin}/login`,
      handleCodeInApp: true,
    };

    return NextResponse.json({ ok: true, actionCodeSettings });
  } catch (e) {
    console.error("❌ send-link error:", e);
    return NextResponse.json({ error: "Failed to prepare magic link" }, { status: 500 });
  }
}

// optional: block non-POST
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
