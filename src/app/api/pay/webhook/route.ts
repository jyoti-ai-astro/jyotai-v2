import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const razorpaySecret = process.env.RAZORPAY_SECRET as string;
    const rawBody = await req.text();

    const signature = req.headers.get('x-razorpay-signature') as string;

    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error("❌ Invalid Razorpay signature");
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    if (event.entity.status === "captured") {
      const email = event.entity.email?.toLowerCase();
      const name = event.entity.notes?.name || "Unknown";
      const purpose = event.entity.notes?.purpose || "standard";

      if (!email) {
        return NextResponse.json({ error: "Missing email" }, { status: 400 });
      }

      let user;
      try {
        user = await adminAuth.getUserByEmail(email);
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          user = await adminAuth.createUser({
            email,
            displayName: name,
            emailVerified: true,
          });
        } else {
          throw err;
        }
      }

      const userRef = adminDb.collection("users").doc(user.uid);

      if (purpose === "upgrade") {
        await userRef.set({
          plan: "premium",
          credits: 20,
          upgradedAt: new Date().toISOString(),
          premiumUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { merge: true });

        console.log(`✅ Upgraded ${email} to Premium`);
      } else {
        await userRef.set({
          email,
          name,
          plan: "standard",
          credits: 3,
          createdAt: new Date().toISOString()
        }, { merge: true });

        console.log(`✅ Registered ${email} with Standard plan`);
      }
    }

    return NextResponse.json({ status: "✅ Payment processed" });

  } catch (err) {
    console.error("🔥 Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
