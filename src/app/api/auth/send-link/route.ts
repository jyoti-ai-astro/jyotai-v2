// src/app/api/auth/send-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { adminAuth } from "@/lib/firebase-admin";
import { sendZepto } from "@/lib/email/zepto";

// must run on Node (uses process.env, firebase-admin)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // --- Rate limit by IP (existing helper)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const rate = rateLimit(`send-link:${ip}`, 5, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // --- Parse + validate email
    const body = await req.json().catch(() => ({}));
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@") || !email.includes(".")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    // --- Build magic link that returns to /login on YOUR domain
    const baseUrl =
      (process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin).replace(/\/+$/, "");

    const magicLink = await adminAuth.generateSignInWithEmailLink(email, {
      url: `${baseUrl}/login`,
      handleCodeInApp: true,
    });

    // --- Compose a simple transactional email (from your own domain via Zepto)
    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto">
        <h2 style="margin:0 0 12px 0">Sign in to JyotAI</h2>
        <p>Click the secure link below to complete sign-in:</p>
        <p><a href="${magicLink}" target="_blank" rel="noopener">${magicLink}</a></p>
        <p style="color:#555">If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `.trim();

    await sendZepto({
      to: email,
      subject: "Your JyotAI sign-in link",
      html,
      fromName: "JyotAI",
      // fromAddress is taken from SENDER_EMAIL in sendZepto() by default
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("❌ send-link error:", e);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}

// Block non-POST (optional)
export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
