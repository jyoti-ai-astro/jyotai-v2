// src/app/api/auth/send-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { adminAuth } from "@/lib/firebase-admin";
import { sendZepto } from "@/lib/email/zepto";

export const runtime = "nodejs";

/** Resolve the exact host users should land on (avoid apex↔www hops). */
function canonicalBase(req: NextRequest) {
  const fromEnv = (process.env.NEXT_PUBLIC_BASE_URL || "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // Hard fallback to request origin if env not set
  return req.nextUrl.origin.replace(/\/+$/, "");
}

function validEmail(v: unknown): string | null {
  const s = String(v || "").trim().toLowerCase();
  return s && s.includes("@") && s.includes(".") ? s : null;
}

export async function POST(req: NextRequest) {
  try {
    // --- 0) Simple rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = rateLimit(`send-link:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    // --- 1) Parse & validate
    const body = await req.json().catch(() => ({}));
    const email = validEmail(body?.email);
    if (!email) {
      return NextResponse.json({ ok: false, error: "Valid email required" }, { status: 400 });
    }

    // --- 2) Ensure Auth user exists (verified so sign-in flows cleanly)
    await adminAuth.getUserByEmail(email).catch(async (e: any) => {
      if (e?.code === "auth/user-not-found") {
        await adminAuth.createUser({ email, emailVerified: true });
        return;
      }
      throw e;
    });

    // --- 3) Build canonical ActionCodeSettings and generate the real link
    const origin = canonicalBase(req);
    const actionCodeSettings = {
      url: `${origin}/login`, // we complete sign-in on /login (client reads oobCode there)
      handleCodeInApp: true,
    };

    const magicLink = await adminAuth.generateSignInWithEmailLink(email, actionCodeSettings);

    // --- 4) Send via Zepto
    const support = process.env.SUPPORT_EMAIL || process.env.SENDER_EMAIL || "order@jyoti.app";
    const html = `
      <div style="background:#0B0F14;color:#F7F7F8;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
        <div style="max-width:560px;margin:0 auto;background:#0F1520;border:1px solid #1E293B;border-radius:12px;padding:24px">
          <h1 style="margin:0 0 12px;font-size:20px;">Your secure sign-in link 🔐</h1>
          <p style="margin:0 0 16px;opacity:.85">Click the button below on this device to finish signing in.</p>
          <p style="margin:16px 0">
            <a href="${magicLink}" style="display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#2A9DF4;color:#001018;font-weight:700">Sign in to JyotAI</a>
          </p>
          <p style="margin:16px 0;opacity:.7;font-size:12px">If the button doesn’t work, copy & paste this URL into your browser:<br/>
            <span style="word-break:break-all">${magicLink}</span>
          </p>
          <p style="margin-top:16px;opacity:.7;font-size:12px">Need help? Reply to this email or write to <a href="mailto:${support}" style="color:#2A9DF4">${support}</a>.</p>
        </div>
        <p style="text-align:center;margin-top:12px;opacity:.6;font-size:12px">© ${new Date().getFullYear()} JyotAI</p>
      </div>
    `.trim();

    await sendZepto({
      to: email,
      subject: "Your secure JyotAI sign-in link",
      html,
      // fromAddress defaults to SENDER_EMAIL; replyTo defaults to SUPPORT_EMAIL (see zepto.ts)
    });

    return NextResponse.json({ ok: true, message: "Magic link sent" });
  } catch (e) {
    console.error("❌ send-link error:", e);
    return NextResponse.json({ ok: false, error: "Failed to send magic link" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "Method not allowed" }, { status: 405 });
}
