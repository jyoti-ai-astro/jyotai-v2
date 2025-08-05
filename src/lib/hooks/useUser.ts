// src/lib/hooks/useUser.ts

"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { app } from "@/lib/firebase-client";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";

// Define a clear type for the user object that combines Auth and Firestore data
export interface AppUser {
  uid: string;
  email: string | null;
  name?: string;
  plan?: 'standard' | 'premium';
  credits?: number;
  referralCode?: string;
  // Add any other fields from your 'users' collection here
}

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    
    // This is the listener for Firebase Auth state changes
    const authUnsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is logged in. Now, listen for real-time updates from Firestore.
        const db = getFirestore(app);
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        // onSnapshot creates a real-time listener for the user's document
        const firestoreUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            // Combine auth info with firestore data
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firestoreData.name,
              plan: firestoreData.plan,
              credits: firestoreData.credits,
              referralCode: firestoreData.referralCode,
            });
          } else {
            // This case might happen if user exists in Auth but not Firestore yet.
            // You can decide how to handle this, e.g., create a doc or just use auth data.
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
            });
          }
          setLoading(false);
        });

        // Return the firestore listener so it can be cleaned up
        return () => firestoreUnsubscribe();

      } else {
        // User is not logged in
        setUser(null);
        setLoading(false);
      }
    });

    // Return the auth listener so it can be cleaned up
    return () => authUnsubscribe();
  }, []);

  return { user, loading };
}