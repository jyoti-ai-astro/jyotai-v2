import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import admin from 'firebase-admin';

// --- CLIENT-SIDE FIREBASE (for the browser) ---
const firebaseConfig = {
apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // We need to add this!
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

// --- SERVER-SIDE FIREBASE (for our Vercel API routes) ---
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);

if (!admin.apps.length) {
admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();