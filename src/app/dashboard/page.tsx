"use client";

import { useUser } from "@/lib/hooks/useUser";
import Loading from "@/components/ui/loading";
import PredictionCard from "@/components/dashboard/PredictionCard";
import Link from "next/link";

export default function DashboardPage() {
  const { user, loading } = useUser();

  if (loading) return <Loading />;
  if (!user)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-white">
        <h2 className="text-xl font-semibold">You are not logged in.</h2>
        <Link href="/" className="text-celestial-gold mt-4">
          Return to the portal.
        </Link>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl text-white font-bold mb-6">Your Predictions</h1>
      <PredictionCard userId={user.uid} />
    </div>
  );
}
