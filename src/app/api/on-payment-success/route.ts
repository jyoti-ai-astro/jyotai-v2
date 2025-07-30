// src/app/api/on-payment-success/route.ts

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

const transport = nodemailer.createTransport({
  host: 'smtp.zeptomail.in',
  port: 587,
  auth: {
    user: process.env.ZEPTO_SMTP_USER as string,
    pass: process.env.ZEPTO_SMTP_PASS as string,
  },
});

export async function POST(req: Request) {
  try {
    const { userEmail, paymentId, orderId, name, dob, query, prediction } = await req.json();

    const normalizedEmail = userEmail.trim().toLowerCase();

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

    const predictionId = `pred_${randomBytes(12).toString('hex')}`;
    await adminDb.collection('users').doc(userId).collection('predictions').doc(predictionId).set({
      query,
      prediction,
      dob,
      paymentId,
      orderId,
      createdAt: new Date().toISOString(),
    });

    await adminDb.collection('users').doc(userId).update({
      credits: admin.firestore.FieldValue.increment(-1),
    });

    const mailOptions = {
      from: '"Brahmin GPT from JyotAI" <order@jyoti.app>',
      to: normalizedEmail,
      subject: '🔮 Your Divine Reading from JyotAI is Ready',
      html: `
        <div style="font-family: serif; line-height: 1.7;">
          <h1>🪔 Greetings, Seeker ${name}</h1>
          <p>The cosmos has spoken. Your divine prediction is safely stored in our sacred records.</p>
          <p>You may revisit your karmic history at any time using the JyotAI portal.</p>
          <p>(In our next milestone, this email will contain your actual Magic Link to log in.)</p>
          <br/>
          <p>🕉️ With divine blessings,<br/><strong>The JyotAI Team</strong></p>
        </div>
      `,
    };

    try {
      await transport.sendMail(mailOptions);
      console.log('✅ Email sent to', normalizedEmail);
    } catch (err) {
      console.error('❌ Email send failed', err);
    }

    return NextResponse.json({ success: true, userId, predictionId });
  } catch (error) {
    console.error('❌ Error in on-payment-success:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
