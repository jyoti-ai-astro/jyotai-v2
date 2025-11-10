// src/lib/firebase.ts
// Client-only Firebase setup for the browser (Next.js App Router).

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// All values come from NEXT_PUBLIC_* envs set in Vercel
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,          // e.g. jyotai-v2-prod.firebaseapp.com
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,            // e.g. jyotai-v2-prod
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,    // e.g. jyotai-v2-prod.appspot.com
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth with durable persistence so the session survives reloads
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => { /* ignore */ });

export { app, auth };
export const db = getFirestore(app);
export const storage = getStorage(app);
