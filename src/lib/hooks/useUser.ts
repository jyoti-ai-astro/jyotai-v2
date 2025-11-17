// src/lib/hooks/useUser.ts
"use client";

import { useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import { app } from "@/lib/firebase-client";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

// This is the shape the rest of the app should use
export interface AppUser {
  uid: string;
  email: string | null;
  name?: string;

  // Billing / usage
  plan: "standard" | "premium";
  credits: number; // for standard users
  quota?: {
    month: string;
    monthly_limit: number;
    used: number;
  }; // for premium users

  // Extra fields we may add later
  dob?: string;
  tob?: string;
  place?: string;
  tz?: string;
  base_chart_id?: string;

  referralCode?: string;
  referredBy?: string;
  isAdmin?: boolean;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    let firestoreUnsubscribe: (() => void) | null = null;

    const authUnsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        // Clean up any previous Firestore listener
        if (firestoreUnsubscribe) {
          firestoreUnsubscribe();
          firestoreUnsubscribe = null;
        }

        if (!firebaseUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        // Get custom claims (for admin)
        let isAdmin = false;
        try {
          const idTokenResult = await firebaseUser.getIdTokenResult();
          isAdmin = idTokenResult.claims.isAdmin === true;
        } catch (error) {
          console.error("Failed to get token claims:", error);
        }

        const userDocRef = doc(db, "users", firebaseUser.uid);

        firestoreUnsubscribe = onSnapshot(
          userDocRef,
          (docSnap) => {
            const data = docSnap.data() || {};

            const plan = (data.plan as "standard" | "premium") || "standard";
            const credits =
              typeof data.credits === "number" ? data.credits : 0;

            const quota =
              data.quota &&
              typeof data.quota === "object" &&
              data.quota.month &&
              typeof data.quota.monthly_limit === "number" &&
              typeof data.quota.used === "number"
                ? {
                    month: data.quota.month as string,
                    monthly_limit: data.quota.monthly_limit as number,
                    used: data.quota.used as number,
                  }
                : undefined;

            const appUser: AppUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: data.name || undefined,
              plan,
              credits,
              quota,
              dob: data.dob || undefined,
              tob: data.tob || undefined,
              place: data.place || undefined,
              tz: data.tz || undefined,
              base_chart_id: data.base_chart_id || undefined,
              referralCode: data.referralCode || undefined,
              referredBy: data.referredBy || undefined,
              isAdmin,
            };

            setUser(appUser);
            setLoading(false);
          },
          (error) => {
            console.error("Firestore snapshot error:", error);
            setLoading(false);
          }
        );
      }
    );

    return () => {
      authUnsubscribe();
      if (firestoreUnsubscribe) firestoreUnsubscribe();
    };
  }, []);

  return { user, loading };
}
