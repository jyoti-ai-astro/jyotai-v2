// src/app/admin/layout.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic'; // Disable static rendering

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies(); // ✅ synchronous in App Router

  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie.value, true);

    if (!(decoded as any).isAdmin) {
      redirect('/login');
    }
  } catch (err) {
    console.error('❌ verifySessionCookie failed:', err);
    redirect('/login');
  }

  return <>{children}</>;
}
