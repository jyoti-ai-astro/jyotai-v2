"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = window.localStorage.getItem('emailForSignIn');
    if (savedEmail && isSignInWithEmailLink(auth, window.location.href)) {
      signInWithEmailLink(auth, savedEmail, window.location.href)
        .then(async (result) => {
          window.localStorage.removeItem('emailForSignIn');
          const idToken = await result.user.getIdToken();
          await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${idToken}` },
          });
          window.location.href = '/dashboard';
        })
        .catch((err) => {
          setError("Failed to sign in with magic link. It may be expired or invalid.");
          console.error(err);
        });
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    window.localStorage.setItem('emailForSignIn', e.target.value);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl text-center text-celestial-gold mb-8" style={{ fontFamily: "'Marcellus', serif" }}>
          Enter the Sanctum
        </h1>
        <form className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Divine Email"
            className="w-full p-4 bg-gray-700 text-white rounded-md"
          />
          <button type="submit" className="w-full font-bold py-3 px-8 rounded-lg bg-celestial-gold text-cosmic-navy">
            Enter
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
      </div>
    </main>
  );
}
