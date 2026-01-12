
import { initializeApp, getApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Correctly parse the service account key from the environment variable.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

// Initialize the app only if it hasn't been already.
// Use the service account credential if it exists.
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

// Export the initialized SDKs.
export function getSdks() {
  return { firestore, auth };
}
