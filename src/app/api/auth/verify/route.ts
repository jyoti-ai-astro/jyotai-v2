// src/app/api/auth/verify/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin'; // Must be Edge-safe import

export async function POST(req: Request) {
  try {
    const { sessionCookie } = await req.json();

    if (!sessionCookie) {
      return NextResponse.json({ ok: false });
    }

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    return NextResponse.json({
      ok: true,
      isAdmin: decodedClaims.isAdmin === true,
    });
  } catch (err) {
    console.error('❌ API Verify Error:', err);
    return NextResponse.json({ ok: false });
  }
}
