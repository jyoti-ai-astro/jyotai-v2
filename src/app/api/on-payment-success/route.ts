import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { randomBytes } from 'crypto';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { userEmail, paymentId, orderId, name, dob, query, prediction } = await req.json();

    const normalizedEmail = userEmail.trim().toLowerCase();

    // Firebase Auth logic (perfect as it is)
    let user: admin.auth.UserRecord;
    try {
      user = await adminAuth.getUserByEmail(normalizedEmail);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        user = await adminAuth.createUser({ email: normalizedEmail, displayName: name, emailVerified: true });
      } else { throw error; }
    }

    // Firestore logic (perfect as it is)
    const userRef = adminDb.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      await userRef.set({ email: normalizedEmail, name, plan: 'standard', createdAt: new Date().toISOString(), credits: 3 });
    }
    const predictionId = `pred_${randomBytes(12).toString('hex')}`;
    await userRef.collection('predictions').doc(predictionId).set({ query, prediction, dob, paymentId, orderId, createdAt: new Date().toISOString() });
    
    // This adds the timestamp and decrements credits, as per your brilliant suggestion.
    await userRef.update({
      credits: admin.firestore.FieldValue.increment(-1),
      lastPredictionAt: new Date().toISOString(),
    });

    // Generate Firebase Magic Link (perfect as it is)
    const link = await adminAuth.generateSignInWithEmailLink(normalizedEmail, {
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback`,
    });

    // --- THIS IS THE FINAL UPGRADE: We now send the email via ZeptoMail ---
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey", // This is the literal string required by ZeptoMail
        pass: process.env.ZEPTO_MAIL_TOKEN as string,
      },
    });

    const mailOptions = {
      from: '"Brahmin GPT from JyotAI" <oracle@jyoti.app>', // Ensure oracle@jyoti.app is a verified sender
      to: normalizedEmail,
      subject: "🔮 Your Divine Reading & Sacred Access Link",
      html: `
        <div style="font-family: serif; line-height: 1.7;">
          <h1>🪔 Greetings, Seeker ${name}</h1>
          <p>The cosmos has spoken. Your divine prediction has been recorded in our sacred archives.</p>
          <p><strong>Click the sacred link below to enter your personal portal and view your history at any time:</strong></p>
          <p><a href="${link}" style="color: #FFD700; font-weight: bold;">Enter Your Divine Portal</a></p>
          <p>This link is your personal key. It is valid for one use.</p>
          <br/>
          <p>🕉️ With divine blessings,<br/><strong>The JyotAI Team</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 ZeptoMail email sent successfully to ${normalizedEmail}.`);
    // --- END OF FINAL UPGRADE ---

    return NextResponse.json({ success: true, userId: user.uid });
  } catch (error) {
    console.error("❌ Error in on-payment-success:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}