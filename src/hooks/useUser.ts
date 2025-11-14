// src/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      async (u) => {
        setUser(u);
        setLoading(false);

        // Optional: ensure server session cookie is in sync
        try {
          if (u) {
            const idToken = await u.getIdToken();
            await fetch("/api/auth/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });
          }
        } catch (e) {
          console.warn("verify cookie sync failed", e);
        }
      },
      (err) => {
        console.error("onAuthStateChanged error", err);
        setError(err.message || "auth_state_error");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  return { user, loading, error };
}
