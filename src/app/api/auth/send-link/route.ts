// src/app/api/auth/send-link/route.ts
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { adminAuth } from "@/lib/firebase-admin";
import { sendZepto } from "@/lib/email/zepto";

export const runtime = "nodejs";

function baseUrl(req: NextRequest) {
  // IMPORTANT: use the exact public origin you actually serve (and which Firebase Auth has authorized)
  // You set this in Vercel as NEXT_PUBLIC_BASE_URL = https://www.jyoti.app
  const v = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
  return v.replace(/\/+$/, "");
}

function normalizeEmail(v: unknown) {
  const s = String(v || "").trim().toLowerCase();
  return s && s.includes("@") && s.includes(".") ? s : null;
}

export async function POST(req: NextRequest) {
  try {
    // simple per-IP throttle
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const lim = rateLimit(`send-link:${ip}`, 5, 60_000);
    if (!lim.ok) {
      return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
    }

    const { email: rawEmail } = await req.json().catch(() => ({}));
    const email = normalizeEmail(rawEmail);
    if (!email) return NextResponse.json({ error: "Valid email required" }, { status: 400 });

    // ensure user exists
    await adminAuth.getUserByEmail(email).catch(async (e: any) => {
      if (e?.code === "auth/user-not-found") {
        await adminAuth.createUser({ email, emailVerified: true });
        return;
      }
      throw e;
    });

    // Build action settings with YOUR public app URL (Firebase will append the oobCode/apiKey/mode)
    const origin = baseUrl(req);
    const actionCodeSettings = {
      url: `${origin}/login`,
      handleCodeInApp: true,
    };

    // Create the signed email link from Firebase Admin
    const magicLink = await adminAuth.generateSignInWithEmailLink(email, actionCodeSettings);

    const support = process.env.SUPPORT_EMAIL || process.env.SENDER_EMAIL || "order@jyoti.app";
    const html = `
      <div style="background:#0B0F14;color:#F7F7F8;padding:24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
        <div style="max-width:560px;margin:0 auto;background:#0F1520;border:1px solid #1E293B;border-radius:12px;padding:24px">
          <h1 style="margin:0 0 12px;font-size:20px;">Your secure sign-in link 🔐</h1>
          <p style="margin:0 0 16px;opacity:.85">Click the button below on <b>this device</b> to finish signing in.</p>
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
      // replyTo is set inside sendZepto based on SUPPORT_EMAIL if present
    });

    return NextResponse.json({ ok: true, message: "Magic link sent" });
  } catch (e) {
    console.error("❌ send-link error:", e);
    return NextResponse.json({ error: "Failed to send magic link" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
