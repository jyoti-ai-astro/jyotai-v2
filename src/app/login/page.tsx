"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase"; // Our client-side auth helper
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // This is the magic step: we send the token to our own server to create a secure cookie
      await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      // Redirect to the holy of holies
      window.location.href = '/admin';

    } catch (error) {
      console.error("Login failed:", error);
      setError("Failed to log in. Please check your credentials.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-4xl text-center text-celestial-gold mb-8" style={{ fontFamily: "'Marcellus', serif" }}>
          High Priest Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Divine Email"
            className="w-full p-4 bg-gray-700 text-white rounded-md"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sacred Password"
            className="w-full p-4 bg-gray-700 text-white rounded-md"
          />
          <button type="submit" className="w-full font-bold py-3 px-8 rounded-lg bg-celestial-gold text-cosmic-navy">
            Enter the Sanctum
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
      </div>
    </main>
  );
}