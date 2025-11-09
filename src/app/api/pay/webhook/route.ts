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

// Drop undefined recursively (Firestore-safe)
function sanitize<T>(obj: T): T {
  if (obj === undefined) return undefined as any;
  if (obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((v) => sanitize(v)).filter((v) => v !== undefined) as any;
  if (typeof obj === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(obj as any)) {
      const sv = sanitize(v as any);
      if (sv !== undefined) out[k] = sv;
    }
    return out;
  }
  return obj;
}

/** Health check (so GET isn’t 405 in logs). Razorpay will POST. */
export async function GET() {
  return NextResponse.json({ ok: true, expects: "POST (Razorpay)" });
}

export async function POST(req: Request) {
  try {
    // 1) Verify signature with raw body
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

    // Prefer Razorpay event id, then payload id, else timestamp
    const auditId = eventIdHeader || String(payload?.id || `evt_${Date.now()}`);
    const auditRef = adminDb.collection("razorpay_events").doc(auditId);

    const existingAudit = await auditRef.get();
    if (existingAudit.exists && existingAudit.get("processedAt")) {
      return NextResponse.json({ status: "ok", duplicate_event: true });
    }

    // First audit write (sanitize prevents undefined)
    await auditRef.set(
      sanitize({
        event: eventType,
        payloadSnippet: {
          id: eventIdHeader || payload?.id || null, // << never undefined
          created_at: payload?.created_at ?? null,
          account_id: payload?.account_id ?? null,
        },
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      { merge: true }
    );

    // Only process captured payments (others: mark ignored)
    if (eventType !== "payment.captured") {
      await auditRef.update({ ignored: true });
      return NextResponse.json({ status: "ignored", event: eventType });
    }

    // 2) Extract fields
    const payment: AnyObject = payload?.payload?.payment?.entity || {};
    const order: AnyObject = payload?.payload?.order?.entity || {};

    const paymentId = payment?.id || "";
    const orderId = order?.id || payment?.order_id || "";

    if (!paymentId) {
      await auditRef.update({ error: "missing_payment_id" });
      return NextResponse.json({ error: "Missing payment id" }, { status: 400 });
    }

    // Idempotency on payments/<paymentId>
    const paymentsRef = adminDb.collection("payments").doc(paymentId);
    const paymentsSnap = await paymentsRef.get();
    if (paymentsSnap.exists) {
      await auditRef.update({ duplicate: true, duplicate_by: "paymentId" });
      return NextResponse.json({ status: "ok", duplicate: true });
    }

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

    // 3) Ensure Auth user exists
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

    // 4) Write payment + user
    const now = new Date();
    const monthStr = yyyymm(now);

    await adminDb.runTransaction(async (tx) => {
      tx.set(
        paymentsRef,
        sanitize({
          paymentId,
          orderId,
          eventId: auditId,
          email: normalizedEmail,
          name,
          purpose,
          referredBy: referredBy || null,
          amount: payment?.amount ?? null,
          currency: payment?.currency ?? null,
          method: payment?.method ?? null,
          status: payment?.status ?? null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        })
      );

      const userRef = adminDb.collection("users").doc(uid);
      const byEmailRef = adminDb.collection("users_by_email").doc(normalizedEmail);
      const userSnap = await tx.get(userRef);
      const data = (userSnap.exists ? (userSnap.data() as AnyObject) : {}) || {};

      const base = {
        email: normalizedEmail,
        name,
        updatedAt: now.toISOString(),
        referralCode:
          data.referralCode ||
          (uid.slice(0, 6) + Math.floor(Math.random() * 1000)).toUpperCase(),
      };

      if (purpose === "premium") {
        const premiumUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        tx.set(
          userRef,
          sanitize({
            ...base,
            plan: "premium",
            upgradedAt: now.toISOString(),
            premiumUntil,
            quota: { month: monthStr, monthly_limit: 20, used: 0 },
            credits: Number(data?.credits ?? 0),
          }),
          { merge: true }
        );
      } else {
        tx.set(
          userRef,
          sanitize({
            ...base,
            plan: data?.plan || "standard",
            createdAt: data?.createdAt || now.toISOString(),
            credits: typeof data?.credits === "number" ? data.credits : 3,
          }),
          { merge: true }
        );
      }

      tx.set(
        byEmailRef,
        sanitize({
          uid,
          email: normalizedEmail,
          lastPaymentId: paymentId,
          updatedAt: now.toISOString(),
        }),
        { merge: true }
      );

      if (referredBy) {
        const refQ = await tx.get(
          adminDb.collection("users").where("referralCode", "==", referredBy).limit(1)
        );
        if (!refQ.empty) {
          const refDoc = refQ.docs[0];
          const curr = Number((refDoc.data() as AnyObject).credits || 0);
          tx.update(refDoc.ref, {
            credits: curr + 1,
            updatedAt: now.toISOString(),
          });
        }
      }
    });

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
