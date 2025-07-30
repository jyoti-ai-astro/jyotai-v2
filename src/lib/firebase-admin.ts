import admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} else {
  app = admin.app();
}

export const adminDb = app.firestore();
export const adminAuth = app.auth();
