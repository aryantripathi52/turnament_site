
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

const app =
  getApps().length > 0
    ? getApp()
    : initializeApp(
        serviceAccount
          ? { credential: cert(serviceAccount) }
          : undefined
      );

const firestore = getFirestore(app);
const auth = getAuth(app);

export function getSdks() {
  return { firestore, auth };
}
