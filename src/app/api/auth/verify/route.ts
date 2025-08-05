// src/app/api/auth/verify/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin'; // Your Node.js-only admin SDK init

export const runtime = 'nodejs'; // Explicitly run this API route in Node.js

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authorization token not provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await adminAuth.verifyIdToken(token); // Firebase Admin verification

    return new NextResponse(
      JSON.stringify({ message: 'Token verified successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Token verification failed in API:', error);

    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', details: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
