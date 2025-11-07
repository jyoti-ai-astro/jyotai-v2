// src/components/dashboard/LimitsBanner.tsx
"use client";

import { useEffect, useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase-client";
import Link from "next/link";

type UserDoc = {
  plan?: "standard" | "premium";
  credits?: number;
  premiumUntil?: string;
  email?: string;
  name?: string;
};

export default function LimitsBanner({ userId }: { userId: string }) {
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const run = async () => {
      try {
        const db = getFirestore(app);
        const snap = await getDoc(doc(db, "users", userId));
        setUserDoc((snap.data() as UserDoc) || {});
      } catch (e) {
        console.error("LimitsBanner load failed:", e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [userId]);

  if (loading) return null;

  const plan = userDoc?.plan ?? "standard";
  const credits = typeof userDoc?.credits === "number" ? userDoc!.credits : undefined;
  const premiumUntil = userDoc?.premiumUntil ? new Date(userDoc.premiumUntil) : null;

  if (plan === "premium") {
    return (
      <div className="mb-6 rounded-xl border border-emerald-700/60 bg-emerald-900/20 p-4 text-emerald-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold">🌟 Premium active</p>
            <p className="text-sm opacity-90">
              {premiumUntil ? `Valid until ${premiumUntil.toLocaleString()}` : "Active now"}
            </p>
          </div>
          {typeof credits === "number" && (
            <div className="rounded-lg bg-black/20 px-3 py-2 text-sm">
              Credits remaining: <span className="font-semibold">{credits}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Standard
  return (
    <div className="mb-6 rounded-xl border border-yellow-600/60 bg-yellow-900/20 p-4 text-yellow-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">🪔 Standard plan</p>
          <p className="text-sm opacity-90">
            {typeof credits === "number"
              ? `You have ${credits} credit${credits === 1 ? "" : "s"} left.`
              : "You start with 3 free credits."}
          </p>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex items-center rounded-lg bg-yellow-400 px-3 py-2 text-black font-semibold hover:bg-yellow-300"
        >
          Upgrade to Premium
        </Link>
      </div>
    </div>
  );
}
