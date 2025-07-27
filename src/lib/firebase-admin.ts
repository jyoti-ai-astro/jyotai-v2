// src/lib/firebase-admin.ts
// This file is PURELY for the server-side. It is our sacred, secret well.

import admin from 'firebase-admin';

// This logic only runs if the master key is present.
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    throw new Error("Firebase Admin secret key is not configured.");
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();