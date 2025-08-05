"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setUser(user);
      else setUser(null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-2xl animate-pulse">Loading Your Sacred Archives...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-red-500">Access Denied.</p>
          <Link href="/" className="text-celestial-gold mt-4">Return to the portal.</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl text-celestial-gold" style={{ fontFamily: "'Marcellus', serif" }}>
            Your Sacred Archives
          </h1>
          <button 
            onClick={handleSignOut}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
        <div>
          <h2 className="text-3xl text-supernova-magenta mb-4" style={{ fontFamily: "'Marcellus', serif" }}>
            Past Predictions
          </h2>
          <div className="bg-gray-800 p-6 rounded-lg">
            <p>The sacred scrolls of your past predictions will be unfurled here soon.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
