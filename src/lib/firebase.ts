// src/lib/firebase.ts
// Client-side Firebase (Auth/Firestore/Storage). Single source of truth.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// We prefer env vars, but fall back to the known prod config so that
// Vercel env mistakes don't break login in production.
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyB_vTt2vxxe7ZlcbftI9u2Z1dVKykZYBXw",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "jyotai-v2-prod.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "jyotai-v2-prod",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "jyotai-v2-prod.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "844576794256",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:844576794256:web:2773b1f7d354a9cff05a15",
};

// This log is fine – these values are PUBLIC anyway (NEXT_PUBLIC)
// and it helps confirm everything is wired correctly in the browser.
if (typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.log("[JyotAI] Firebase client config", firebaseConfig);
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
