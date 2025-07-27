// src/app/api/on-payment-success/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type Body = {
  userEmail: string;
  paymentId: string;
  orderId: string;
  name: string;
  dob: string;
  query: string;
  prediction: string;
};

export async function POST(req: Request) {
  try {
    const {
      userEmail,
      paymentId,
      orderId,
      name,
      dob,
      query,
      prediction,
    } = (await req.json()) as Body;

    const normalizedEmail = userEmail.trim().toLowerCase();

    // 1) Upsert user
    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', normalizedEmail).limit(1).get();

    let userId: string;
    if (userQuery.empty) {
      const newUserRef = await usersRef.add({
        email: normalizedEmail,
        name,
        plan: 'standard',
        createdAt: new Date().toISOString(),
        credits: 3,
      });
      userId = newUserRef.id;
    } else {
      userId = userQuery.docs[0].id;
    }

    // 2) Save prediction
    const predictionId = `pred_${randomBytes(12).toString('hex')}`;
    await adminDb
      .collection('users')
      .doc(userId)
      .collection('predictions')
      .doc(predictionId)
      .set({
        query,
        prediction,
        dob,
        paymentId,
        orderId,
        createdAt: new Date().toISOString(),
      });

    // 3) Decrement credits
    await adminDb.collection('users').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(-1),
    });

    // 4) Send email (best-effort)
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Brahmin GPT <oracle@jyotai.app>', // ✅ Corrected verified sender
          to: normalizedEmail,
          subject: '🔮 Your Divine Reading from JyotAI is Ready',
          html: `
            <h1>Greetings, Seeker ${name},</h1>
            <p>The cosmos has spoken. Your divine prediction has been recorded in our sacred archives.</p>
            <p>You can return to your history of readings at any time by visiting your personal portal.</p>
            <p>With divine blessings,</p>
            <p><strong>Brahmin GPT</strong></p>
          `,
        });
        console.log(`✅ Magic Link email sent to ${normalizedEmail}`);
      } catch (emailError) {
        console.error('❌ Failed to send Magic Link email:', emailError);
      }
    } else {
      console.warn('RESEND_API_KEY not set. Skipping email send.');
    }

    return NextResponse.json({ success: true, userId, predictionId });
  } catch (error) {
    console.error('❌ Error in on-payment-success:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
