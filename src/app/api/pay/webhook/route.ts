// src/app/api/pay/webhook/route.ts

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin'; // Corrected Path
import type { UserRecord } from 'firebase-admin/auth';

// Define a type for the Razorpay event payload for better type safety
interface RazorpayEvent {
  entity: {
    status: string;
    email?: string;
    notes?: {
      name?: string;
      purpose?: string;
      ref?: string;
    };
  };
}

export async function POST(req: Request) {
  try {
    const razorpaySecret = process.env.RAZORPAY_SECRET as string;
    if (!razorpaySecret) {
      throw new Error("RAZORPAY_SECRET is not set in environment variables.");
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.error("❌ Razorpay signature missing from headers");
      return NextResponse.json({ error: 'Signature missing' }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error("❌ Invalid Razorpay signature");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event: RazorpayEvent = JSON.parse(rawBody);

    if (event.entity.status === "captured") {
      const email = event.entity.email?.toLowerCase();
      const name = event.entity.notes?.name || "Unknown User";
      const purpose = event.entity.notes?.purpose || "standard";
      const referredBy = event.entity.notes?.ref || "";

      if (!email) {
        console.error("❌ Missing email in Razorpay payload");
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
      }

      // 🔐 Get or create Firebase user
      let user: UserRecord;
      try {
        user = await adminAuth.getUserByEmail(email);
      } catch (error: unknown) {
        // Type guard to check if it's a Firebase Auth error
        if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === "auth/user-not-found") {
          user = await adminAuth.createUser({
            email,
            displayName: name,
            emailVerified: true,
          });
        } else {
          // Re-throw if it's another type of error
          throw error;
        }
      }

      const userRef = adminDb.collection("users").doc(user.uid);
      const userSnap = await userRef.get();
      const userData = userSnap.data();
      let referralCode = userData?.referralCode;

      // 🧬 Generate if missing
      if (!referralCode) {
        referralCode = user.uid.slice(0, 6) + Math.floor(Math.random() * 1000);
      }

      const commonData = {
        email,
        name,
        referralCode,
      };

      const now = new Date();
      const premiumUntilDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      if (purpose === "upgrade") {
        await userRef.set({
          ...commonData,
          plan: "premium",
          credits: (userData?.credits || 0) + 20, // Add credits instead of overwriting
          upgradedAt: now.toISOString(),
          premiumUntil: premiumUntilDate.toISOString(),
        }, { merge: true });

        console.log(`✅ Upgraded ${email} to Premium`);
      } else {
        await userRef.set({
          ...commonData,
          plan: "standard",
          credits: 3,
          createdAt: now.toISOString(),
        }, { merge: true });

        console.log(`✅ Registered ${email} with Standard plan`);
      }

      // 🎁 Referral bonus logic
      if (referredBy) {
        const refSnap = await adminDb.collection("users")
          .where("referralCode", "==", referredBy)
          .limit(1)
          .get();

        if (!refSnap.empty) {
          const refDoc = refSnap.docs[0];
          const refData = refDoc.data();
          const refCredits = refData.credits || 0;

          await refDoc.ref.update({
            credits: refCredits + 1
          });

          console.log(`🎁 Referral bonus granted to ${refData.email}`);
        } else {
          console.warn(`⚠️ Referral code not found: ${referredBy}`);
        }
      }
    }

    return NextResponse.json({ status: "✅ Payment processed" });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
    console.error("🔥 Webhook error:", errorMessage);
    return NextResponse.json({ error: "Webhook failed", details: errorMessage }, { status: 500 });
  }
}