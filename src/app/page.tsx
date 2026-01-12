
import { Hero } from '@/components/sections/hero';
import { PlayerDashboard } from '@/components/player/player-dashboard';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { StaffDashboard } from '@/components/staff/staff-dashboard';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { getSdks } from '@/firebase/server';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';

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

  if (!user) {
    return <Hero />;
  }

  if (profile?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (profile?.role === 'staff') {
    return <StaffDashboard />;
  }
  
  // Default to player dashboard if user is logged in but has no specific role found
  // or role is 'player'
  return <PlayerDashboard />;
}
