import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY!); // Ensure it's not undefined

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

    // 1. Upsert User
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

    // 2. Save Prediction
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

    // 3. Decrement Credits
    await adminDb.collection('users').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(-1),
    });

    // 4. Send Email via Resend
    const sendResult = await resend.emails.send({
      from: 'Brahmin GPT <no-reply@jyotai.app>',
      to: [normalizedEmail],
      subject: '🔮 Your Divine Reading from JyotAI is Ready',
      html: `
        <div style="font-family: serif; line-height: 1.7;">
          <h1>🪔 Greetings, Seeker ${name}</h1>
          <p>The cosmos has spoken. Your divine prediction is safely stored in our sacred records.</p>
          <p>You may revisit your karmic history at any time using the JyotAI portal.</p>
          <br/>
          <p>🕉️ With divine blessings,<br/><strong>Brahmin GPT</strong></p>
        </div>
      `,
    });

    console.log('📧 Resend email response:', sendResult);

    return NextResponse.json({ success: true, userId, predictionId });
  } catch (error) {
    console.error('❌ Error in on-payment-success:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
