// src/lib/firebase.ts
// This file is now PURELY for the client-side (the browser).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "jyotai-v2-prod.firebaseapp.com",
  projectId: "jyotai-v2-prod",
  storageBucket: "jyotai-v2-prod.firebasestorage.app",
  messagingSenderId: "844576794256",
  appId: "1:844576794256:web:2773b1f7d354a9cff05a15"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);