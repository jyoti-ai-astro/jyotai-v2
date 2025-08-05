// src/lib/hooks/useUser.ts

"use client";

import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebase-client";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export function useUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const db = getFirestore(app);
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);
      const userData = docSnap.exists() ? docSnap.data() : {};
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userData,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
