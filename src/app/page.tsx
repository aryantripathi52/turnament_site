
import { Hero } from '@/components/sections/hero';
import { cookies } from 'next/headers';
import { getSdks } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import Dashboard from '@/components/dashboard-loader';

async function getUserSession() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return { user: null, profile: null };
  }

  try {
    const { auth, firestore } = getSdks();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    const profileRef = doc(firestore, 'users', decodedClaims.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as UserProfile;
      return { user: decodedClaims, profile };
    }

    return { user: decodedClaims, profile: null };
  } catch (error) {
    console.error("Session verification failed:", error);
    return { user: null, profile: null };
  }
}

export default async function Home() {
  const { user, profile } = await getUserSession();

  // If no user is authenticated, show the public landing page.
  if (!user) {
    return <Hero />;
  }

  // If the user is authenticated, show the appropriate dashboard.
  // The Dashboard component itself contains client-side logic (`useUser`)
  // to get the most up-to-date profile information.
  // The `initialRole` provides a fast server-side guess to prevent layout shift.
  const initialRole = profile?.role || 'player';

  return <Dashboard initialRole={initialRole} />;
}
