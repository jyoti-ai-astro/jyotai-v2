// src/app/api/auth/send-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

// Must run on Node (uses process.env, not Edge)
export const runtime = "nodejs";

/**
 * Compute the base public URL we want Firebase to redirect back to.
 * In Vercel you’ve set NEXT_PUBLIC_BASE_URL to https://www.jyoti.app
 */
function baseUrl(req: NextRequest) {
  const v = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  return v.replace(/\/+$/, ""); // strip trailing slash
}

function normalizeEmail(v: unknown): string | null {
  const s = String(v || "").trim().toLowerCase();
  if (!s || !s.includes("@") || !s.includes(".")) return null;
  return s;
}

/**
 * POST /api/auth/send-link
 *
 * - Rate-limits requests.
 * - Returns actionCodeSettings for the frontend to call
 *   `sendSignInLinkToEmail(auth, email, actionCodeSettings)`.
 *
 * The actual email is sent by Firebase (no-reply) using the **same
 * browser SDK / project config** that will later verify the link.
 */
export async function POST(req: NextRequest) {
  try {
    // 1) Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const limit = rateLimit(`send-link:${ip}`, 5, 60_000);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // 2) Validate email
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail((body as any)?.email);
    if (!email) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // 3) Build actionCodeSettings using your canonical public URL
    const origin = baseUrl(req);
    const actionCodeSettings = {
      url: `${origin}/login`, // Firebase will append oobCode, apiKey, mode, etc
      handleCodeInApp: true,
    };

    // 4) Return settings to the client – the browser SDK will send the email
    return NextResponse.json({ ok: true, actionCodeSettings });
  } catch (e) {
    console.error("❌ send-link error:", e);
    return NextResponse.json(
      { error: "Failed to prepare magic link" },
      { status: 500 }
    );
  }
}

// Optionally block non-POST
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
