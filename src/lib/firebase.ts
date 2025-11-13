// src/lib/firebase.ts
// Client-side Firebase (Auth/Firestore/Storage). Single source of truth.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,           // e.g. jyotai-v2-prod.firebaseapp.com
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,             // e.g. jyotai-v2-prod
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,     // e.g. jyotai-v2-prod.appspot.com
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { app };
