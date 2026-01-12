
import { Hero } from '@/components/sections/hero';
import { cookies } from 'next/headers';
import { getSdks } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { redirect } from 'next/navigation';

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
    // If cookie is invalid, it will throw, and we treat it as no session.
    return { user: null, profile: null };
  }
}

export default async function Home() {
  const { user, profile } = await getUserSession();

  // If no user is authenticated, show the public landing page.
  if (!user || !profile) {
    return <Hero />;
  }

  // If user is authenticated, redirect them to their respective dashboard.
  if (profile.role === 'admin' || profile.role === 'staff') {
      redirect('/admin');
  } else {
      redirect('/player');
  }
}
