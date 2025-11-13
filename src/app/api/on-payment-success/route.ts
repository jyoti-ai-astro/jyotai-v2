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

    // 1) Ensure Auth user exists
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

    // 2) Ensure base Firestore user doc
    const userRef = adminDb.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      await userRef.set({
        email,
        name: name || "",
        plan: "standard",
        createdAt: new Date().toISOString(),
        credits: 3, // standard gets 3 lifetime
        referralCode: randomBytes(4).toString("hex").toUpperCase(),
      });
    }

    const userData = (await userRef.get()).data() as AnyObject;
    const plan: "standard" | "premium" = (userData?.plan as any) || "standard";

    // 3) Enforce limits BEFORE creating prediction
    if (plan === "standard") {
      const remaining = Number(userData?.credits ?? 0);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "Prediction limit reached for Standard plan." },
          { status: 403 }
        );
      }
    } else {
      const nowMonth = yyyymm();
      const quota = userData?.quota || { month: nowMonth, monthly_limit: 20, used: 0 };
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

    // 4) Create prediction FIRST and capture its ID
    const predictionId = `pred_${randomBytes(12).toString("hex")}`;
    await userRef.collection("predictions").doc(predictionId).set({
      query,
      prediction,
      dob,
      paymentId,
      orderId,
      createdAt: new Date().toISOString(),
    });

    // 5) Update counters AFTER successful write
    if (plan === "standard") {
      await userRef.update({
        credits: admin.firestore.FieldValue.increment(-1),
        lastPredictionAt: new Date().toISOString(),
      });
    } else {
      const nowMonth = yyyymm();
      const latest = (await userRef.get()).data() as AnyObject;
      const q = latest?.quota || { month: nowMonth, monthly_limit: 20, used: 0 };
      if (q.month !== nowMonth) {
        q.month = nowMonth;
        q.used = 0;
        q.monthly_limit = 20;
      }
      q.used = Number(q.used || 0) + 1;
      await userRef.set({ quota: q, lastPredictionAt: new Date().toISOString() }, { merge: true });
    }

    // 6) Generate a Firebase Magic Link that lands on /login (hosted on your own domain)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jyoti.app";
    const magicLink = await adminAuth.generateSignInWithEmailLink(email, {
      url: `${baseUrl}/login`,
      handleCodeInApp: true,
    });

    // 7) Send transactional email via ZeptoMail FROM your domain
    const html = predictionEmailHTML({
      userName: name || "",
      predictionId,
      plan: plan === "premium" ? "PREMIUM" : "STANDARD",
      appUrl: baseUrl,
      supportEmail: process.env.SUPPORT_EMAIL || "support@jyoti.app",
      // We include the magic link inline as a “secondary” path (users can log in if needed)
      // The main CTA goes to /dashboard/predictions/{id}.
    }).replace(
      "</div>\n\n      <p class=\"muted\"",
      // Add an extra paragraph with the magic link for convenience/login issues
      `<p style="margin:10px 0 0 0;">Or sign in first with this secure link: <a href="${magicLink}" style="color:#2A9DF4" target="_blank" rel="noopener">Magic Sign-In</a></p>\n\n      <p class="muted"`
    );

    await sendZepto({
      to: email,
      subject: "🔮 Your Divine Reading & Portal Access",
      html,
      fromName: "Brahmin GPT · JyotAI",
    });

    return NextResponse.json({ ok: true, predictionId });
  } catch (err) {
    console.error("🔥 Error in on-payment-success:", (err as any)?.stack || err);
    return NextResponse.json({ error: "Failed to process payment." }, { status: 500 });
  }
}
