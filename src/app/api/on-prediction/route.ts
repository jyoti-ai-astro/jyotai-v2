// src/app/api/on-prediction/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    
    // Use shared rate limit utility
    const rateLimitResult = rateLimit(`pred:${ip}`, 8, 60_000);
    if (!rateLimitResult.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const { userId, name, dob, query, prediction } = await req.json();

    // Basic validation
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    const q = String(query || "").trim();
    const pred = String(prediction || "").trim();
    if (!q || !pred) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (q.length > 2000 || pred.length > 20000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // Use transaction for atomic credit check and deduction
    const userRef = adminDb.collection("users").doc(userId);
    
    await adminDb.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error("User not found");
      }
      
      const user = userSnap.data() as { plan?: "standard" | "premium"; credits?: number } | undefined;
      if (!user?.plan) {
        throw new Error("Invalid user record");
      }

      // Limit logic: use credits for Standard; 20/mo for Premium
      if (user.plan === "standard") {
        const credits = Number(user.credits ?? 0);
        if (credits <= 0) {
          throw new Error("Prediction limit exceeded");
        }
        // Debit credit atomically
        transaction.update(userRef, {
          credits: admin.firestore.FieldValue.increment(-1),
        });
      } else if (user.plan === "premium") {
        // FIX: Check both month AND year
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const predsSnap = await transaction.get(userRef.collection("predictions"));
        const thisMonth = predsSnap.docs.filter((d) => {
          const ts = d.data().createdAt;
          if (!ts) return false;
          const date = new Date(ts);
          return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
        
        if (thisMonth >= 20) {
          throw new Error("Monthly prediction limit reached");
        }
      } else {
        throw new Error("Invalid plan type");
      }

      // Save prediction
      const predRef = userRef.collection("predictions").doc();
      transaction.set(predRef, {
        name: name || "",
        dob: dob || "",
        query: q,
        prediction: pred,
        createdAt: new Date().toISOString(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("🔥 Prediction save error:", errorMessage);
    
    // Return appropriate status codes based on error
    if (errorMessage.includes("not found") || errorMessage.includes("Invalid")) {
      return NextResponse.json({ error: errorMessage }, { status: 404 });
    }
    if (errorMessage.includes("limit")) {
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
