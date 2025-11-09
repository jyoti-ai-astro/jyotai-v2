// src/app/dashboard/layout.tsx
import React, { Suspense } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A boundary is required for useSearchParams/useRouter hooks inside this segment
  return <Suspense fallback={null}>{children}</Suspense>;
}
