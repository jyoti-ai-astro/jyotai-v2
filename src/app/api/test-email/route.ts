// src/app/api/test-email/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs'; // make sure this is not on the edge

export async function GET() {
  try {
    const key = process.env.RESEND_API_KEY;
    console.log('RESEND_API_KEY present?', !!key);

    const resend = new Resend(key);
    const { data, error } = await resend.emails.send({
      from: 'Brahmin GPT <no-reply@jyotai.app>',
      to: ['diptanshu.ojha1@gmail.com'],
      subject: 'JyotAI test email (from /api/test-email)',
      html: '<p>It works. The server can send email.</p>',
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ ok: false, error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error('Test email failed:', e);
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
