// src/app/admin/layout.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie.value, true) as DecodedIdToken & { isAdmin?: boolean };

    if (!decoded.isAdmin) {
      redirect('/login');
    }
  } catch (err) {
    console.error('❌ verifySessionCookie failed:', err);
    redirect('/login');
  }

  return <>{children}</>;
}
