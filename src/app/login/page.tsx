// src/app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendSignInLinkToEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
} from "firebase/auth";

type Status = "idle" | "sending" | "sent";
type SocialLoading = "none" | "google" | "facebook";

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
  const [socialLoading, setSocialLoading] = useState<SocialLoading>("none");
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

  async function socialSignIn(provider: "google" | "facebook") {
    setErr(null);
    setMsg(null);

    try {
      setSocialLoading(provider);

      const firebaseProvider =
        provider === "google"
          ? new GoogleAuthProvider()
          : new FacebookAuthProvider();

      const cred = await signInWithPopup(auth, firebaseProvider);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        console.error("Session creation failed", await res.text());
        throw new Error("Session creation failed");
      }

      window.location.replace("/dashboard");
    } catch (e: any) {
      console.error(`${provider} sign-in error:`, e);
      const firebaseMessage =
        e?.message?.toString().replace("Firebase: ", "") || "";
      setErr(
        firebaseMessage ||
          `Could not sign in with ${provider === "google" ? "Google" : "Facebook"}. Please try again.`
      );
    } finally {
      setSocialLoading("none");
    }
  }

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
  const googleBusy = socialLoading === "google";
  const facebookBusy = socialLoading === "facebook";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F14] px-4">
      <div className="w-full max-w-2xl border border-[#1E293B] bg-[#0F1520] rounded-xl p-8">
        <h1
          className="text-center text-4xl mb-2"
          style={{ color: "#F7F7F8", fontFamily: "'Marcellus', serif" }}
        >
          Enter the Sanctum
        </h1>
        <p className="text-center mb-8 text-sm text-slate-300">
          Sign in with Google or Facebook for instant access, or continue with
          email.
        </p>

        {/* Social login buttons */}
        <div className="space-y-3 mb-8">
          <button
            type="button"
            onClick={() => socialSignIn("google")}
            disabled={googleBusy || facebookBusy || sending}
            className="w-full py-3 font-semibold rounded-md flex items-center justify-center gap-2 bg-white text-[#0B0F14]"
          >
            {googleBusy ? "Connecting to Google…" : "Continue with Google"}
          </button>

          <button
            type="button"
            onClick={() => socialSignIn("facebook")}
            disabled={googleBusy || facebookBusy || sending}
            className="w-full py-3 font-semibold rounded-md flex items-center justify-center gap-2 bg-[#1877F2] text-white"
          >
            {facebookBusy ? "Connecting to Facebook…" : "Continue with Facebook"}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="px-3 text-xs uppercase tracking-wide text-slate-400">
            or continue with email
          </span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* Email magic-link form */}
        <form onSubmit={onSend} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              const v = e.target.value;
              setEmail(v);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(
                  "emailForSignIn",
                  v.trim().toLowerCase()
                );
              }
            }}
            placeholder="you@example.com"
            className="w-full p-3 rounded-md bg-[#131a26] text-white outline-none"
            required
          />
          <button
            type="submit"
            disabled={sending || googleBusy || facebookBusy}
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
