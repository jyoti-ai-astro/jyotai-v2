// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // If opened from the magic link, finish sign-in immediately.
  useEffect(() => {
    (async () => {
      const href = typeof window !== "undefined" ? window.location.href : "";
      if (!href) return;

      // Debug hint if something goes wrong
      // console.log("[login] current URL:", href);

      if (!isSignInWithEmailLink(auth, href)) return;

      let saved = window.localStorage.getItem("emailForSignIn") || "";
      if (!saved) {
        // Cross-device fallback – Firebase requires the email again
        saved = window.prompt("Confirm your email to finish sign-in") || "";
      }
      if (!saved) {
        setErr("We couldn’t confirm your email. Please re-enter it below.");
        return;
      }

      try {
        const cred = await signInWithEmailLink(auth, saved, href);
        window.localStorage.removeItem("emailForSignIn");

        // Make a server session cookie
        const idToken = await cred.user.getIdToken();
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!res.ok) {
          throw new Error(`Session create failed (${res.status})`);
        }

        // Go to the app
        window.location.replace("/dashboard");
      } catch (e) {
        console.error("[login] complete-link error:", e);
        setErr("The sign-in link was invalid or expired. Please request a new one.");
      }
    })();
  }, []);

  // Request the magic link
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setErr(null);

    try {
      const clean = email.trim().toLowerCase();
      if (!clean || !clean.includes("@")) {
        setErr("Please enter a valid email.");
        return;
      }

      setSending(true);

      // Ask server for actionCodeSettings (uses correct base URL)
      const r = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to prepare magic link");
      }
      const { actionCodeSettings } = await r.json();

      await sendSignInLinkToEmail(auth, clean, actionCodeSettings);
      window.localStorage.setItem("emailForSignIn", clean);
      setMsg("Magic link sent! Check your inbox and open the link on this device.");
    } catch (e) {
      console.error("[login] send-link error:", e);
      setErr("Could not send magic link. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0F14]">
      <div className="w-full max-w-md p-8 bg-[#0F1520] border border-[#1E293B] rounded-xl shadow">
        <h1 className="text-center text-white text-3xl mb-6" style={{ fontFamily: "'Marcellus', serif" }}>
          Enter the Sanctum
        </h1>

        <form onSubmit={handleSend} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              window.localStorage.setItem("emailForSignIn", v.trim().toLowerCase());
            }}
            placeholder="you@example.com"
            className="w-full p-3 rounded-md bg-[#101826] text-white outline-none border border-[#1E293B]"
            required
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 font-semibold rounded-lg bg-[#FFC857] text-black disabled:opacity-60"
          >
            {sending ? "Sending..." : "Get Magic Link"}
          </button>

          {msg && <p className="text-green-400 text-center">{msg}</p>}
          {err && <p className="text-red-400 text-center">{err}</p>}
        </form>
      </div>
    </main>
  );
}
