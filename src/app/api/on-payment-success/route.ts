// src/app/api/on-payment-success/route.ts
import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { randomBytes } from "crypto";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { sendZepto } from "@/lib/email/zepto";
import { predictionEmailHTML } from "@/lib/email/templates";

export const runtime = "nodejs";

type AnyObject = Record<string, any>;
function yyyymm(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      userEmail,
      paymentId = "",
      orderId = "",
      name = "",
      dob = "",
      query = "",
      prediction = "",
    } = body as AnyObject;

    const email = String(userEmail || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "userEmail is required" }, { status: 400 });
    }

    // --- 1) Ensure Auth user exists
    const userRecord =
      (await adminAuth.getUserByEmail(email).catch(async (e: any) => {
        if (e?.code === "auth/user-not-found") {
          return await adminAuth.createUser({
            email,
            displayName: name || undefined,
            emailVerified: true,
          });
        }
        throw e;
      })) || (await adminAuth.getUserByEmail(email));

    const uid = userRecord.uid;

    // --- 2) Ensure base Firestore doc
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        email,
        name: name || "",
        plan: "standard",
        createdAt: new Date().toISOString(),
        credits: 3,
        referralCode: randomBytes(4).toString("hex").toUpperCase(),
      });
    }

    const userData = (await userRef.get()).data() as AnyObject;
    const plan: "standard" | "premium" = (userData?.plan as any) || "standard";

    // --- 3) LIMIT LOGIC
    if (plan === "standard") {
      const remaining = Number(userData?.credits ?? 0);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "Prediction limit reached for Standard plan." },
          { status: 403 }
        );
      }
    } else {
      // Premium monthly quota kept in users.quota
      const nowMonth = yyyymm();
      const quota: AnyObject = userData?.quota || { month: nowMonth, monthly_limit: 20, used: 0 };

      // If month rolled over, reset
      if (quota.month !== nowMonth) {
        quota.month = nowMonth;
        quota.used = 0;
        quota.monthly_limit = 20;
      }

      if (Number(quota.used) >= Number(quota.monthly_limit)) {
        return NextResponse.json(
          { error: "Monthly prediction limit reached for Premium plan." },
          { status: 403 }
        );
      }
    }

    // --- 4) Save prediction (subcollection)
    const predId = `pred_${randomBytes(12).toString("hex")}`;
    await userRef.collection("predictions").doc(predId).set({
      query,
      prediction,
      dob,
      paymentId,
      orderId,
      createdAt: new Date().toISOString(),
    });

    // --- 5) Update counters
    if (plan === "standard") {
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(-1),
        lastPredictionAt: new Date().toISOString(),
      });
    } else {
      const nowMonth = yyyymm();
      await userRef.set(
        {
          quota: admin.firestore.FieldValue.arrayRemove(null), // no-op to force merge type
        },
        { merge: true }
      );
      // read latest, then set merged quota
      const latest = (await userRef.get()).data() as AnyObject;
      const q = latest?.quota || { month: nowMonth, monthly_limit: 20, used: 0 };
      if (q.month !== nowMonth) {
        q.month = nowMonth;
        q.used = 0;
        q.monthly_limit = 20;
      }
      q.used = Number(q.used || 0) + 1;
      await userRef.set({ quota: q }, { merge: true });
    }

    // --- 6) Magic link (to /login)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jyotai-v2.vercel.app";
    const magicLink = await adminAuth.generateSignInWithEmailLink(email, {
      url: `${baseUrl}/login`,
      handleCodeInApp: true,
    });

    // --- 7) Email via ZeptoMail
    const html = predictionEmailHTML({
      name,
      link: magicLink,
      query,
      dob,
      prediction,
    });

    await sendZepto({
      to: email,
      subject: "🔮 Your Divine Reading & Portal Access",
      html,
      fromName: "Brahmin GPT · JyotAI",
    });

    return NextResponse.json({ status: "✅ Email sent successfully!" });
  } catch (err) {
    console.error("🔥 Error in on-payment-success:", (err as any)?.stack || err);
    return NextResponse.json({ error: "Failed to process payment." }, { status: 500 });
  }
}
