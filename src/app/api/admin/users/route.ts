// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // auth via session cookie
    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ ok:false, error:"no session" }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (decoded.isAdmin !== true) return NextResponse.json({ ok:false, error:"forbidden" }, { status: 403 });

    const usersSnap = await adminDb.collection("users").orderBy("createdAt", "desc").limit(200).get();
    const users = usersSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    return NextResponse.json({ ok: true, users });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || "failed" }, { status: 500 });
  }
}

// quick mutations
export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("session")?.value;
    if (!session) return NextResponse.json({ ok:false }, { status: 401 });
    const decoded = await adminAuth.verifySessionCookie(session, true);
    if (decoded.isAdmin !== true) return NextResponse.json({ ok:false }, { status: 403 });

    const { uid, op } = await req.json();
    if (!uid || !op) return NextResponse.json({ ok:false, error:"bad request" }, { status: 400 });

    const ref = adminDb.collection("users").doc(uid);

    if (op === "makePremium") {
      const until = new Date(Date.now() + 30*24*60*60*1000).toISOString();
      await ref.set({ plan: "premium", premiumUntil: until, credits: 20 }, { merge: true });
    } else if (op === "addCredit") {
      // FIX: Use admin.firestore.FieldValue.increment
      await ref.set(
        { credits: admin.firestore.FieldValue.increment(1) },
        { merge: true }
      );
    } else if (op === "makeStandard") {
      await ref.set({ plan: "standard" }, { merge: true });
    } else {
      return NextResponse.json({ ok:false, error:"unknown op" }, { status: 400 });
    }

    return NextResponse.json({ ok:true });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || "failed" }, { status: 500 });
  }
}
