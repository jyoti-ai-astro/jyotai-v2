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

  // complete sign-in if the URL contains oobCode/mode/apiKey
  useEffect(() => {
    (async () => {
      const href = window.location.href;
      if (!isSignInWithEmailLink(auth, href)) return;

      let saved = window.localStorage.getItem("emailForSignIn") || "";
      if (!saved) {
        // cross-device fallback
        const ask = window.prompt("Please confirm your email to complete sign-in") || "";
        saved = ask.trim().toLowerCase();
      }
      if (!saved) return;

      try {
        const cred = await signInWithEmailLink(auth, saved, href);
        window.localStorage.removeItem("emailForSignIn");
        const idToken = await cred.user.getIdToken();
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error("Session creation failed");
        window.location.replace("/dashboard");
      } catch (e: any) {
        console.error("magic-link signIn error:", e);
        setErr("The sign-in link was invalid or expired. Please request a new one.");
      }
    })();
  }, []);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    const v = email.trim().toLowerCase();
    if (!v || !v.includes("@") || !v.includes(".")) {
      setErr("Please enter a valid email.");
      return;
    }

    try {
      setSending(true);
      // Ask our server for the correct redirect origin (keeps host in sync)
      const r = await fetch("/api/auth/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });
      if (!r.ok) throw new Error("Failed to prepare magic link");

      const { actionCodeSettings } = await r.json();

      // Send the magic link via Firebase (same project config we later use to verify)
      await sendSignInLinkToEmail(auth, v, actionCodeSettings);

      window.localStorage.setItem("emailForSignIn", v);
      setMsg("Magic link sent! Check your inbox and open the link on this device.");
    } catch (e) {
      console.error(e);
      setErr("Could not send magic link. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4">
      <div className="w-full max-w-2xl border border-[#1E293B] bg-[#0F1520] rounded-xl p-8">
        <h1
          className="text-center text-4xl mb-6"
          style={{ color: "#F7F7F8", fontFamily: "'Marcellus', serif" }}
        >
          Enter the Sanctum
        </h1>
        <form onSubmit={onSend} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              window.localStorage.setItem(
                "emailForSignIn",
                v.trim().toLowerCase()
              );
            }}
            placeholder="you@example.com"
            className="w-full p-3 rounded-md bg-[#131a26] text-white outline-none"
            required
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 font-semibold rounded-md"
            style={{
              background: "#FFC857",
              color: "#0B0F14",
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? "Sending…" : "Get Magic Link"}
          </button>
        </form>

        {msg && (
          <p className="text-center mt-4" style={{ color: "#7ef08a" }}>
            {msg}
          </p>
        )}
        {err && (
          <p className="text-center mt-4" style={{ color: "#ff6b6b" }}>
            {err}
          </p>
        )}
      </div>
    </main>
  );
}
