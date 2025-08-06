// src/app/api/on-prediction/route.ts

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { userId, name, dob, query, prediction } = await req.json();

    if (!userId || !query || !prediction) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Fetch user from Firestore
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userSnap.data();

    // ✅ Type safety: check if user and user.plan exist
    if (!user || !user.plan) {
      return NextResponse.json({ error: "Invalid or missing user data" }, { status: 403 });
    }

    const now = new Date();
    let predictionLimit = 0;

    // Determine prediction limits based on plan
    if (user.plan === "standard") {
      predictionLimit = 3;
    } else if (user.plan === "premium") {
      predictionLimit = 20;
    } else {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 403 });
    }

    // Fetch all previous predictions
    const predictionsRef = userRef.collection("predictions");
    const snap = await predictionsRef.get();

    let eligible = true;

    if (user.plan === "standard") {
      eligible = snap.size < predictionLimit;
    }

    if (user.plan === "premium") {
      const upgradedAt = user.upgradedAt ? new Date(user.upgradedAt) : null;

      if (!upgradedAt) {
        return NextResponse.json({ error: "Missing upgradedAt for premium user" }, { status: 400 });
      }

      const daysSinceUpgrade = (now.getTime() - upgradedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpgrade > 30) {
        return NextResponse.json({ error: "Premium plan expired" }, { status: 403 });
      }

      const monthlyPredictions = snap.docs.filter((doc) => {
        const createdAt = doc.data().createdAt;
        return createdAt && new Date(createdAt) >= upgradedAt;
      });

      eligible = monthlyPredictions.length < predictionLimit;
    }

    if (!eligible) {
      return NextResponse.json({ error: "Prediction limit exceeded" }, { status: 403 });
    }

    // Save the new prediction
    await predictionsRef.add({
      name,
      dob,
      query,
      prediction,
      createdAt: now.toISOString(),
    });

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("🔥 Prediction save error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
