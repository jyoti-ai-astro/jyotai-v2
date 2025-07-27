import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { Resend } from 'resend';
import { randomBytes } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { userEmail, paymentId, orderId, name, dob, query, prediction } = await req.json();

    // 1. Find or Create User in Firestore
    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', userEmail).limit(1).get();
    
    let userId: string;
    if (userQuery.empty) {
      // Create new user
      const newUserRef = await usersRef.add({
        email: userEmail,
        name: name,
        plan: 'standard', // All new users start as standard
        createdAt: new Date().toISOString(),
        credits: 3, // Standard plan starts with 3 credits
      });
      userId = newUserRef.id;
    } else {
      // User exists
      userId = userQuery.docs[0].id;
    }

    // 2. Save the Prediction
    const predictionId = `pred_${randomBytes(12).toString('hex')}`;
    await adminDb.collection('users').doc(userId).collection('predictions').doc(predictionId).set({
      query,
      prediction,
      dob,
      paymentId,
      orderId,
      createdAt: new Date().toISOString(),
    });

    // 3. Decrement user credits
    await adminDb.collection('users').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(-1)
    });

    // 4. Send the Magic Link Email (for now, we just confirm success)
    // We will build the full login flow in the next step.
    console.log(`Prediction saved for user ${userId}. A magic link would be sent to ${userEmail}.`);

    return NextResponse.json({ success: true, userId });

  } catch (error) {
    console.error("Error in on-payment-success:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}