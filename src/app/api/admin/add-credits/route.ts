import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const uid = String(form.get("uid") || "");
    const deltaRaw = form.get("delta");
    const delta = Number(deltaRaw ?? 1);

    if (!uid) {
      return NextResponse.json({ ok: false, error: "Missing uid" }, { status: 400 });
    }
    if (!Number.isFinite(delta)) {
      return NextResponse.json({ ok: false, error: "Invalid delta" }, { status: 400 });
    }

    const session = req.cookies.get("session")?.value;
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (decoded.isAdmin !== true) {
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    await adminDb.collection("users").doc(uid).set(
      { credits: admin.firestore.FieldValue.increment(delta) },
      { merge: true }
    );
    return NextResponse.redirect(new URL("/admin", req.url));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
