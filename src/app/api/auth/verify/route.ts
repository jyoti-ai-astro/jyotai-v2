// src/app/api/auth/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

// ✅ firebase-admin is NOT Edge-compatible
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let { sessionCookie, idToken } = await req.json().catch(() => ({}));

    // If nothing sent in body, try to pull session cookie directly
    if (!sessionCookie && !idToken) {
      const autoCookie = req.cookies.get('session')?.value;
      if (!autoCookie) {
        return NextResponse.json({ ok: false, error: 'No token provided' }, { status: 400 });
      }
      sessionCookie = autoCookie;
    }

    // Prefer session cookie (middleware/SSR), fallback to idToken (client check)
    const decoded = sessionCookie
      ? await adminAuth.verifySessionCookie(sessionCookie, true)
      : await adminAuth.verifyIdToken(idToken as string, true);

    return NextResponse.json({
      ok: true,
      isAdmin: decoded.isAdmin === true,
    });
  } catch (err) {
    console.error('❌ API Verify Error:', err);
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}

// Optional: reject non-POST
export async function GET() {
  return NextResponse.json({ ok: false, error: 'Method not allowed' }, { status: 405 });
}
