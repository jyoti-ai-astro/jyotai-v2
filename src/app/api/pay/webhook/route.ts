// src/app/api/pay/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import admin from "firebase-admin";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
type AnyObject = Record<string, any>;

function yyyymm(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Health/sanity endpoint so GETs don’t appear as 405 in Vercel logs.
 * Razorpay will POST; this is only for us and uptime pings.
 */
export async function GET() {
  return NextResponse.json({ ok: true, expects: "POST (Razorpay)" });
}

export async function POST(req: Request) {
  try {
    // --- 1) Verify webhook signature (raw body required) ---
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: "RAZORPAY_WEBHOOK_SECRET not set" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const eventIdHeader = req.headers.get("x-razorpay-event-id") || "";
    const payload: AnyObject = JSON.parse(rawBody);
    const eventType: string = payload?.event || "unknown";

    // Use event id (preferred) → fallback to payload id → fallback to timestamp
    const auditId = eventIdHeader || String(payload?.id || `evt_${Date.now()}`);
    const auditRef = adminDb.collection("razorpay_events").doc(auditId);

    // Idempotency: if we've already processed this event, short-circuit.
    const existingAudit = await auditRef.get();
    if (existingAudit.exists && existingAudit.get("processedAt")) {
      return NextResponse.json({ status: "ok", duplicate_event: true });
    }

    // Record the event (merged) for traceability
    await auditRef.set(
      {
        event: eventType,
        payloadSnippet: {
          id: payload?.id,
          created_at: payload?.created_at,
          account_id: payload?.account_id,
        },
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Ignore anything except payment.captured (but still return 200)
    if (eventType !== "payment.captured") {
      await auditRef.update({ ignored: true });
      return NextResponse.json({ status: "ignored", event: eventType });
    }

    // --- 2) Extract payment/order fields ---
    const payment: AnyObject = payload?.payload?.payment?.entity || {};
    const order: AnyObject = payload?.payload?.order?.entity || {};

    const paymentId = payment?.id || "";
    const orderId = order?.id || payment?.order_id || "";

    if (!paymentId) {
      await auditRef.update({ error: "missing_payment_id" });
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }

    // Idempotency by payment id as well
    const paymentsRef = adminDb.collection("payments").doc(paymentId);
    const paymentsSnap = await paymentsRef.get();
    if (paymentsSnap.exists) {
      await auditRef.update({ duplicate: true, duplicate_by: "paymentId" });
      return NextResponse.json({ status: "ok", duplicate: true });
    }

    // Notes from payment or order
    const pNotes: AnyObject = payment?.notes || {};
    const oNotes: AnyObject = order?.notes || {};

    const email =
      (payment?.email as string) ||
      (pNotes?.email as string) ||
      (oNotes?.email as string) ||
      "";

    const name =
      (pNotes?.name as string) ||
      (oNotes?.name as string) ||
      payment?.contact ||
      "Unknown User";

    let purpose =
      (pNotes?.purpose as string) ||
      (oNotes?.purpose as string) ||
      "standard";

    if (purpose === "upgrade") purpose = "premium";

    const referredBy =
      (pNotes?.ref as string) ||
      (oNotes?.ref as string) ||
      "";

    if (!email) {
      await auditRef.update({ error: "missing_email" });
      return NextResponse.json({ error: "Missing buyer email" }, { status: 400 });
    }

    if ((payment?.status || "") !== "captured") {
      await auditRef.update({ ignored: true, reason: "not_captured" });
      return NextResponse.json({ status: "ignored" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // --- 3) Ensure Auth user exists ---
    const userRecord =
      (await adminAuth.getUserByEmail(normalizedEmail).catch(async (e: any) => {
        if (e?.code === "auth/user-not-found") {
          return await adminAuth.createUser({
            email: normalizedEmail,
            displayName: name || undefined,
            emailVerified: true,
          });
        }
        throw e;
      })) || (await adminAuth.getUserByEmail(normalizedEmail));

    const uid = userRecord.uid;

    // --- 4) Create payments/<paymentId> and update users ---
    const now = new Date();
    const monthStr = yyyymm(now);

    await adminDb.runTransaction(async (tx) => {
      // write payments doc
      tx.set(paymentsRef, {
        paymentId,
        orderId,
        eventId: auditId,
        email: normalizedEmail,
        name,
        purpose,
        referredBy: referredBy || null,
        amount: payment?.amount,
        currency: payment?.currency,
        method: payment?.method,
        status: payment?.status,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const userRef = adminDb.collection("users").doc(uid);
      const byEmailRef = adminDb.collection("users_by_email").doc(normalizedEmail);
      const userSnap = await tx.get(userRef);
      const data = (userSnap.exists ? (userSnap.data() as AnyObject) : {}) || {};

      // Base user fields
      const base = {
        email: normalizedEmail,
        name,
        updatedAt: now.toISOString(),
        referralCode:
          data.referralCode ||
          (uid.slice(0, 6) + Math.floor(Math.random() * 1000)).toUpperCase(),
      };

      if (purpose === "premium") {
        // Premium: set plan + fresh monthly quota (20)
        const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        tx.set(
          userRef,
          {
            ...base,
            plan: "premium",
            upgradedAt: now.toISOString(),
            premiumUntil,
            quota: { month: monthStr, monthly_limit: 20, used: 0 },
            credits: Number(data?.credits ?? 0), // credits irrelevant on premium path
          },
          { merge: true }
        );
      } else {
        // Standard: initialize credits (3) if new
        tx.set(
          userRef,
          {
            ...base,
            plan: data?.plan || "standard",
            createdAt: data?.createdAt || now.toISOString(),
            credits: typeof data?.credits === "number" ? data.credits : 3,
          },
          { merge: true }
        );
      }

      // Also maintain an email-keyed mirror if you want quick lookups by email
      tx.set(
        byEmailRef,
        {
          uid,
          email: normalizedEmail,
          lastPaymentId: paymentId,
          updatedAt: now.toISOString(),
        },
        { merge: true }
      );

      // referral bonus (+1 credit to referrer if exists)
      if (referredBy) {
        const refQ = await tx.get(
          adminDb.collection("users").where("referralCode", "==", referredBy).limit(1)
        );
        if (!refQ.empty) {
          const refDoc = refQ.docs[0];
          tx.update(refDoc.ref, {
            credits: Number((refDoc.data() as AnyObject).credits || 0) + 1,
            updatedAt: now.toISOString(),
          });
        }
      }
    });

    // Mark processed
    await auditRef.update({
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentId,
      userUid: uid,
    });

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("🔥 Webhook error:", err?.stack || err?.message || err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
