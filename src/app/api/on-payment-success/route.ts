import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import { randomBytes } from 'crypto';

// We now summon our new, more powerful divine messenger
const mailerSend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY as string,
});

export async function POST(req: Request) {
  try {
    const { userEmail, paymentId, orderId, name, dob, query, prediction } = await req.json();

    const normalizedEmail = userEmail.trim().toLowerCase();

    const usersRef = adminDb.collection('users');
    const userQuery = await usersRef.where('email', '==', normalizedEmail).limit(1).get();
    let userId: string;
    if (userQuery.empty) {
      const newUserRef = await usersRef.add({ email: normalizedEmail, name, plan: 'standard', createdAt: new Date().toISOString(), credits: 3 });
      userId = newUserRef.id;
    } else {
      userId = userQuery.docs[0].id;
    }

    const predictionId = `pred_${randomBytes(12).toString('hex')}`;
    await adminDb.collection('users').doc(userId).collection('predictions').doc(predictionId).set({ query, prediction, dob, paymentId, orderId, createdAt: new Date().toISOString() });
    await adminDb.collection('users').doc(userId).update({ credits: admin.firestore.FieldValue.increment(-1) });

    // --- THIS IS THE UPGRADE: We are now sending the email via MailerSend ---
    const sentFrom = new Sender("oracle@jyoti.app", "Brahmin GPT from JyotAI");
    const recipients = [new Recipient(normalizedEmail, name)];
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("🔮 Your Divine Reading from JyotAI is Ready")
      .setHtml(`
        <div style="font-family: serif; line-height: 1.7;">
          <h1>🪔 Greetings, Seeker ${name}</h1>
          <p>The cosmos has spoken. Your divine prediction is safely stored in our sacred records.</p>
          <p>You may revisit your karmic history at any time using the JyotAI portal.</p>
          <p>(In our next milestone, this email will contain your actual Magic Link to log in.)</p>
          <br/>
          <p>🕉️ With divine blessings,<br/><strong>The JyotAI Team</strong></p>
        </div>
      `);

    try {
      await mailerSend.email.send(emailParams);
      console.log(`📧 MailerSend email sent successfully to ${normalizedEmail}.`);
    } catch (emailError) {
      console.error("❌ Failed to send MailerSend email:", emailError);
    }
    // --- END OF UPGRADE ---

    return NextResponse.json({ success: true, userId, predictionId });
  } catch (error) {
    console.error("❌ Error in on-payment-success:", error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}