// src/app/api/on-prediction/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Helper to keep month format consistent across app
function yyyymm(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Shared rate limit utility
    const rateLimitResult = rateLimit(`pred:${ip}`, 8, 60_000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({} as any));
    const {
      userId,
      name,
      dob,
      query,
      prediction,
      topic,
    }: {
      userId?: string;
      name?: string;
      dob?: string;
      query?: string;
      prediction?: string;
      topic?: string;
    } = body || {};

    // Basic validation
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const q = String(query || "").trim();
    const pred = String(prediction || "").trim();
    if (!q || !pred) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (q.length > 2000 || pred.length > 20000) {
      return NextResponse.json(
        { error: "Payload too large" },
        { status: 413 }
      );
    }

    const userRef = adminDb.collection("users").doc(userId);
    const nowMonth = yyyymm();

    await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error("User not found");
      }

      const user = userSnap.data() as {
        plan?: "standard" | "premium";
        credits?: number;
        quota?: { month?: string; monthly_limit?: number; used?: number };
      } | null;

      if (!user || !user.plan) {
        throw new Error("Invalid user record");
      }

      const plan: "standard" | "premium" = user.plan;

      // === LIMIT LOGIC (unified with your new model) ===
      if (plan === "standard") {
        const credits = Number(user.credits ?? 0);
        if (credits <= 0) {
          throw new Error("Prediction limit exceeded");
        }

        // Debit 1 credit atomically
        transaction.update(userRef, {
          credits: admin.firestore.FieldValue.increment(-1),
          lastPredictionAt: new Date().toISOString(),
        });
      } else if (plan === "premium") {
        let quota = user.quota || {
          month: nowMonth,
          monthly_limit: 20,
          used: 0,
        };

        // Reset quota if new month
        if (quota.month !== nowMonth) {
          quota.month = nowMonth;
          quota.used = 0;
          quota.monthly_limit = quota.monthly_limit || 20;
        }

        const used = Number(quota.used ?? 0);
        const monthlyLimit = Number(quota.monthly_limit ?? 20);

        if (used >= monthlyLimit) {
          throw new Error("Monthly prediction limit reached");
        }

        quota.used = used + 1;

        transaction.set(
          userRef,
          {
            quota,
            lastPredictionAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } else {
        throw new Error("Invalid plan type");
      }

      // === SAVE PREDICTION (matches your richer schema, but backwards compatible) ===
      const predRef = userRef.collection("predictions").doc();

      const nowIso = new Date().toISOString();

      transaction.set(predRef, {
        // old fields (for existing UI)
        query: q,
        prediction: pred,
        dob: dob || "",
        name: name || "",
        createdAt: nowIso,

        // new schema-style fields
        question: q,
        topic: topic || "",
        planAtPurchase: plan,
        usedCredit: 1,
        status: "ok",
        meta: {},

        // You can later add meta.palmImageIds, meta.faceImageIds, meta.kundaliFileId
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    console.error("🔥 Prediction save error:", errorMessage);

    if (errorMessage.includes("not found") || errorMessage.includes("Invalid")) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes("limit")) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
