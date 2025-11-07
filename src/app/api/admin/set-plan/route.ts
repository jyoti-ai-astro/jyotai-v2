import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const uid = String(form.get("uid") || "");
    const plan = String(form.get("plan") || "standard");

    // auth (must be admin)
    const cookie = req.headers.get("cookie") || "";
    const session = cookie.split(";").map(s=>s.trim()).find(s=>s.startsWith("session="))?.split("=")[1];
    if (!session) return NextResponse.redirect("/login");
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (decoded.isAdmin !== true) return NextResponse.json({ ok:false }, { status:403 });

    await adminDb.collection("users").doc(uid).set({ plan }, { merge: true });
    return NextResponse.redirect("/admin");
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok:false }, { status:500 });
  }
}
