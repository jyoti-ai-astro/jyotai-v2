import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
      const idToken = authorization.split('Bearer ')[1];
      
      // Set session expiration to 14 days.
      const expiresIn = 60 * 60 * 24 * 14 * 1000;
      const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

      const options = {
        name: 'session',
        value: sessionCookie,
        maxAge: expiresIn,
        httpOnly: true,
        secure: true,
      };

      const response = NextResponse.json({ status: 'success' });
      response.cookies.set(options);
      return response;
    }
    return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}