// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
} from "firebase/auth";

type Status = "idle" | "sending" | "sent";

function getActionCodeSettings() {
  // Fallback for SSR / safety
  const base =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_BASE_URL || "https://www.jyoti.app"
      : window.location.origin;

  return {
    // The link will always bounce back to /login on the same host
    url: `${base}/login`,
    handleCodeInApp: true,
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Complete sign-in if this page is opened via magic link
  useEffect(() => {
    (async () => {
      try {
        const href = window.location.href;
        if (!isSignInWithEmailLink(auth, href)) return;

        let saved = window.localStorage.getItem("emailForSignIn") || "";
        if (!saved) {
          const ask =
            window.prompt(
              "Please confirm your email to complete sign-in"
            ) || "";
          saved = ask.trim().toLowerCase();
        }
        if (!saved) return;

        const cred = await signInWithEmailLink(auth, saved, href);
        window.localStorage.removeItem("emailForSignIn");

        const idToken = await cred.user.getIdToken();

        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!res.ok) {
          console.error("Session creation failed", await res.text());
          throw new Error("Session creation failed");
        }

        // Success: go to dashboard
        window.location.replace("/dashboard");
      } catch (e: any) {
        console.error("magic-link signIn error:", e);
        setErr(
          "The sign-in link was invalid or expired. Please request a new one."
        );
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
      setStatus("sending");

      // Persist email for later completion
      window.localStorage.setItem("emailForSignIn", v);

      const actionCodeSettings = getActionCodeSettings();

      await sendSignInLinkToEmail(auth, v, actionCodeSettings);

      setStatus("sent");
      setMsg(
        "Magic link sent! Check your inbox and open the link on this device."
      );
    } catch (e: any) {
      console.error("sendSignInLinkToEmail error:", e);
      // Show a bit more detail if Firebase gives a message
      const firebaseMessage =
        e?.message?.toString().replace("Firebase: ", "") || "";
      setErr(
        firebaseMessage ||
          "Could not send magic link. Please try again after a moment."
      );
      setStatus("idle");
    }
  }

  const sending = status === "sending";

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
