import { NextResponse } from 'next/server';
// --- THIS IS THE FIX: We now import from our new, dedicated admin file ---
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
// --- END OF FIX ---
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { userEmail, paymentId, orderId, name, dob, query, prediction } = await req.json();

    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();
    
    let userId: string;
    if (userQuery.empty) {
      const newUserRef = await usersRef.add({
        email: userEmail,
        name,
        plan: 'standard',
        createdAt: new Date().toISOString(),
        credits: 3,
      });
      userId = newUserRef.id;
    } else {
      userId = userQuery.docs[0].id;
    }

    const predictionId = `pred_${randomBytes(12).toString('hex')}`;
    await adminDb.collection('users').doc(userId).collection('predictions').doc(predictionId).set({
      query,
      prediction,
      dob,
      paymentId,
      orderId,
      createdAt: new Date().toISOString(),
    });

    // This line is now correct because we are using the correct 'admin' object
    await adminDb.collection('users').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(-1),
    });

    console.log(`Prediction saved for user ${userId}. A magic link would be sent to ${userEmail}.`);
    return NextResponse.json({ success: true, userId });

  } catch (error) {
    console.error("Error in on-payment-success:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}