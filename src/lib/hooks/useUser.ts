"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase-client";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

export interface AppUser {
  uid: string;
  email: string | null;
  name?: string;
  plan?: "standard" | "premium";
  credits?: number;
  referralCode?: string;
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);

    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const db = getFirestore(app);
        const userDocRef = doc(db, "users", firebaseUser.uid);

        const firestoreUnsubscribe = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const firestoreData = docSnap.data();
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firestoreData.name,
                plan: firestoreData.plan,
                credits: firestoreData.credits,
                referralCode: firestoreData.referralCode,
              });
            } else {
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
              });
            }
            setLoading(false);
          },
          (error) => {
            console.error("Firestore snapshot error:", error);
            setLoading(false);
          }
        );

        return () => firestoreUnsubscribe();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => authUnsubscribe();
  }, []);

  return { user, loading };
}
