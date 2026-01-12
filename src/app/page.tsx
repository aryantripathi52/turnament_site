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
    // Use server-side SDKs to verify the session cookie
    const { auth, firestore } = getSdks();
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Fetch the user's profile from Firestore
    const profileRef = doc(firestore, 'users', decodedClaims.uid);
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const profile = profileSnap.data() as UserProfile;
      return { user: decodedClaims, profile };
    }

    // User is authenticated but has no profile document
    return { user: decodedClaims, profile: null };
  } catch (error) {
    console.error("Session verification failed:", error);
    // Invalid cookie or other error
    return { user: null, profile: null };
  }
}

export default async function Home() {
  const { user, profile } = await getUserSession();

  // If no user is authenticated, show the public landing page.
  if (!user) {
    return <Hero />;
  }

  // If the user is authenticated, pass their role to the client-side
  // Dashboard component, which will handle rendering the correct UI.
  // We default to 'player' if the profile or role is missing for an authenticated user.
  const initialRole = profile?.role || 'player';

  return <Dashboard initialRole={initialRole} />;
}
