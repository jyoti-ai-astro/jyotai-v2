"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase"; // Our client-side auth helper
import { onAuthStateChanged, User } from "firebase/auth";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This is a real-time listener that checks if a user is logged in
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await auth.signOut();
    // We also need to clear our secure session cookie
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/'; // Redirect to homepage
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
          <a href="/" className="text-celestial-gold mt-4">Return to the portal.</a>
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