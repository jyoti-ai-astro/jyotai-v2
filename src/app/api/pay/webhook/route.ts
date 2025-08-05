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
      const referrerCode = event.entity.notes?.referrer || null;

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

      const commonData: any = {
        email,
        name,
        plan: purpose === "upgrade" ? "premium" : "standard",
        credits: purpose === "upgrade" ? 20 : 3,
        createdAt: new Date().toISOString(),
      };

      if (purpose === "upgrade") {
        commonData.premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        commonData.upgradedAt = new Date().toISOString();
      }

      if (referrerCode) {
        commonData.referredBy = referrerCode;

        // Attempt to increment referral count
        const refSnap = await adminDb.collection("users")
          .where("referralCode", "==", referrerCode).limit(1).get();

        if (!refSnap.empty) {
          const refDoc = refSnap.docs[0];
          const refData = refDoc.data();
          const refRef = refDoc.ref;

          const updatedCredits = (refData.credits || 0) + 1;
          const updatedReferrals = (refData.referralsCount || 0) + 1;

          await refRef.update({
            credits: updatedCredits,
            referralsCount: updatedReferrals,
          });

          console.log(`🎉 Referral: ${email} was referred by ${referrerCode}`);
        } else {
          console.warn(`⚠️ Referrer code ${referrerCode} not found`);
        }
      }

      await userRef.set(commonData, { merge: true });

      console.log(`✅ Processed payment for ${email} with ${purpose} plan`);
    }

    return NextResponse.json({ status: "✅ Payment processed" });
  } catch (err) {
    console.error("🔥 Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
