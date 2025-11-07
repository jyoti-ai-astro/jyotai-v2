// src/app/api/qa/create-fake-prediction/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get("cookie") || "";
    const session = cookie.split(";").map(c=>c.trim()).find(c=>c.startsWith("session="))?.split("=")[1];
    if (!session) return NextResponse.json({ ok:false, error:"not logged in" }, { status:401 });
    const decoded = await adminAuth.verifySessionCookie(session, true);

    const uid = decoded.uid;
    const userRef = adminDb.collection("users").doc(uid);
    const id = `pred_${randomBytes(6).toString("hex")}`;
    await userRef.collection("predictions").doc(id).set({
      query: "Will I find clarity this week?",
      prediction:
        "A gentle alignment forms in your chart. Keep your schedule light; clarity arrives when the mind is unhurried.",
      createdAt: new Date().toISOString(),
      dob: "",
      paymentId: "qa_test",
      orderId: "qa_test",
    });

    return NextResponse.json({ ok:true, id });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || "failed" }, { status:500 });
  }
}
