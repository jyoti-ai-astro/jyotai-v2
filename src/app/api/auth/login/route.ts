// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

const SESSION_COOKIE_NAME = "session";
// 14 days in ms
const SESSION_EXPIRES_IN_MS = 14 * 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const authHeader =
      req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 }
      );
    }

    const idToken = authHeader.slice("Bearer ".length).trim();

    // 1) Verify the Firebase ID token
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const { uid, email } = decoded;

    if (!uid) {
      return NextResponse.json(
        { status: "error", message: "Invalid token (no uid)" },
        { status: 400 }
      );
    }

    // 2) Create a long-lived session cookie
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_IN_MS,
    });

    // 3) Ensure a user document exists in Firestore
    if (email) {
      const userRef = adminDb.collection("users").doc(uid);
      const snap = await userRef.get();

      if (!snap.exists) {
        // First login → bootstrap a basic profile
        await userRef.set(
          {
            email,
            plan: "standard", // default plan
            credits: 3, // default free predictions
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } else {
        // Update lastSeen timestamp
        await userRef.set(
          {
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    }

    // 4) Build response and set cookie
    const res = NextResponse.json({ status: "success" });

    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: true,
      path: "/",
      sameSite: "lax",
      maxAge: SESSION_EXPIRES_IN_MS / 1000,
    });

    return res;
  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
