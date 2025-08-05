// src/app/api/auth/verify/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase/firebaseAdmin'; // Your admin initialization

// This is a special Next.js variable that forces this route to run on Node.js.
// It's not strictly necessary for API Routes in the `app` directory as they default to Node.js,
// but it's good practice to be explicit.
export const runtime = 'nodejs'; 

export async function POST(request: NextRequest) {
  try {
    // 1. Get the token from the request body
    const { token } = await request.json();

    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Authorization token not provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Verify the token using Firebase Admin SDK
    await adminAuth.verifyIdToken(token);

    // 3. If verification is successful, return a success response
    return new NextResponse(
      JSON.stringify({ message: 'Token verified successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // 4. If verification fails, return an unauthorized error
    console.error('Error verifying token in API route:', error);
    
    // You can inspect the error code for more specific reasons, e.g., 'auth/id-token-expired'
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized', details: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}