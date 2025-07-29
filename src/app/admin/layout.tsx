// src/app/admin/layout.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic'; // ensure route is always server-rendered

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies(); // ✅ synchronous
  const session = cookieStore.get('session')?.value;

  if (!session) {
    redirect('/login');
  }

  try {
    const decoded = await adminAuth.verifySessionCookie(session, true);

    if (!decoded.isAdmin) {
      redirect('/login');
    }
  } catch (e) {
    console.error('verifySessionCookie failed:', e);
    redirect('/login');
  }

  return <>{children}</>;
}
