"use client";

import { useEffect, useState } from 'react';
// We will use our client-side Firebase tools here later for auth

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // --- THIS IS OUR SECURITY GUARD ---
    // In the future, we will replace this with a real check to Firebase
    // to see if the logged-in user has the 'admin' role.
    // For now, we will simulate a successful check.
    const checkAuth = async () => {
      console.log("Checking admin authorization...");
      // Simulate check
      await new Promise(resolve => setTimeout(resolve, 500));
      setIsAuthorized(true); // For now, we grant access to everyone for testing
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-2xl animate-pulse">Verifying Your Divine Authority...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-2xl text-red-500">ACCESS DENIED. This chamber is for the High Priest only.</p>
      </div>
    );
  }

  // If authorized, we reveal the throne room.
  return <div className="p-8">{children}</div>;
}