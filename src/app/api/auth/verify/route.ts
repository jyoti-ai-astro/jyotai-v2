// src/app/api/auth/verify/route.ts

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs"; // Ensure this route runs in Node.js

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "No token provided" },
        { status: 400 }
      );
    }

    const decoded = await adminAuth.verifyIdToken(token);

    if (!decoded || !decoded.uid) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json({ message: "Valid token", uid: decoded.uid });
  } catch (error: any) {
    console.error("❌ Token verification failed:", error.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
