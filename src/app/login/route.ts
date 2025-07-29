// src/app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!idToken) {
    return NextResponse.json({ error: 'Missing token' }, { status: 401 });
  }

  try {
    // 5 days
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: 'session',
      value: sessionCookie,
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: expiresIn / 1000,
    });

    return res;
  } catch (e) {
    console.error('createSessionCookie failed', e);
    return NextResponse.json({ error: 'Auth failed' }, { status: 401 });
  }
}
