
import { Hero } from '@/components/sections/hero';
import { cookies } from 'next/headers';
import { getSdks } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import Dashboard from '@/components/dashboard-loader';

async function getUserSession() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return { user: null, profile: null, isLoading: false };
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
      return { user: decodedClaims, profile, isLoading: false };
    }

    // User is authenticated but has no profile document
    // We might consider this a loading state until the client-side useUser hook resolves it
    return { user: decodedClaims, profile: null, isLoading: true };
  } catch (error) {
    console.error("Session verification failed:", error);
    // Invalid cookie or other error
    return { user: null, profile: null, isLoading: false };
  }
}

export default async function Home() {
  const { user, profile, isLoading } = await getUserSession();

  // If we have an authenticated user but are waiting for the profile, show a loading state.
  // This helps bridge the gap after login before the client-side `useUser` hook has the profile data.
  if (user && (!profile || isLoading)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-lg text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user is authenticated, show the public landing page.
  if (!user || !profile) {
    return <Hero />;
  }

  // If the user and profile are loaded, pass the role to the Dashboard component.
  const initialRole = profile.role || 'player';

  return <Dashboard initialRole={initialRole} />;
}
