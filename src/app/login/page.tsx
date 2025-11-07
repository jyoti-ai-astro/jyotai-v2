// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // If user clicked a magic link, complete sign-in and create session
  useEffect(() => {
    const tryComplete = async () => {
      if (!isSignInWithEmailLink(auth, window.location.href)) return;

      // Use saved email if available; otherwise ask for it (cross-device fallback)
      let savedEmail = window.localStorage.getItem("emailForSignIn") || "";
      if (!savedEmail) {
        // Very small UX: prompt is okay here—this path only happens when user opened on another device.
        savedEmail = window.prompt("Please confirm your email to complete sign-in") || "";
      }
      if (!savedEmail) return;

      try {
        const result = await signInWithEmailLink(auth, savedEmail, window.location.href);
        window.localStorage.removeItem("emailForSignIn");
        const idToken = await result.user.getIdToken();
        await fetch("/api/auth/login", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        window.location.href = "/dashboard";
      } catch (err) {
        console.error(err);
        setError("Failed to sign in with magic link. It may be expired or invalid.");
      }
    };

    tryComplete();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (!email) {
        setError("Please enter your email.");
        return;
      }
      setSending(true);

      // Ask server for actionCodeSettings (ensures correct redirect base URL)
      const res = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed to prepare magic link");
      const { actionCodeSettings } = await res.json();

      // Send link from client via Firebase
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", email.trim().toLowerCase());
      setMessage("Magic link sent! Check your inbox and open the link on this device.");
    } catch (err) {
      console.error(err);
      setError("Could not send magic link. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cosmic-navy">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h1
          className="text-4xl text-center text-celestial-gold mb-8"
          style={{ fontFamily: "'Marcellus', serif" }}
        >
          Enter the Sanctum
        </h1>
        <form className="space-y-6" onSubmit={handleSend}>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value.trim();
              setEmail(v);
              window.localStorage.setItem("emailForSignIn", v);
            }}
            placeholder="Divine Email"
            className="w-full p-4 bg-gray-700 text-white rounded-md"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full font-bold py-3 px-8 rounded-lg bg-celestial-gold text-cosmic-navy disabled:opacity-60"
          >
            {sending ? "Sending link..." : "Get Magic Link"}
          </button>

          {message && <p className="text-green-400 text-center mt-3">{message}</p>}
          {error && <p className="text-red-500 text-center mt-3">{error}</p>}
        </form>
      </div>
    </main>
  );
}
