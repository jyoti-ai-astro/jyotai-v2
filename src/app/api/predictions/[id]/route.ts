// src/app/api/predictions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

/**
 * GET /api/predictions/:id
 * Returns the prediction document for the currently authenticated user.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing prediction id" }, { status: 400 });
    }

    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const decoded = await adminAuth.verifySessionCookie(session, true);
    const uid = decoded.uid;

    const userRef = adminDb.collection("users").doc(uid);
    const [userSnap, predSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("predictions").doc(id).get(),
    ]);

    if (!userSnap.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!predSnap.exists) return NextResponse.json({ error: "Prediction not found" }, { status: 404 });

    const user = userSnap.data() || {};
    const pred = predSnap.data() || {};

    return NextResponse.json({
      id,
      user: { name: user.name || "", email: user.email || "" },
      prediction: {
        query: pred.query || "",
        body: pred.prediction || "",
        dob: pred.dob || "",
        createdAt: pred.createdAt || null,
      },
    });
  } catch (e) {
    console.error("GET prediction error:", e);
    return NextResponse.json({ error: "Failed to load prediction" }, { status: 500 });
  }
}
