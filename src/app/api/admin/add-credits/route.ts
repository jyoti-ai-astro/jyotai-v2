import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const uid = String(form.get("uid") || "");
    const delta = Number(form.get("delta") || 1);

    // FIX: Use Next.js cookie API instead of manual parsing
    const session = req.headers.get("cookie")?.split(";")
      .map(s => s.trim())
      .find(s => s.startsWith("session="))
      ?.split("=")[1];
    
    if (!session) return NextResponse.redirect("/login");
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (decoded.isAdmin !== true) return NextResponse.json({ ok:false }, { status:403 });

    await adminDb.collection("users").doc(uid).set(
      { credits: admin.firestore.FieldValue.increment(delta) },
      { merge: true }
    );
    return NextResponse.redirect("/admin");
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok:false }, { status:500 });
  }
}
