
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { StaffDashboard } from '@/components/staff/staff-dashboard';
import Dashboard from '@/components/dashboard-loader';
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
      // Security check: ensure only admin/staff can access this page
      if (profile.role !== 'admin' && profile.role !== 'staff') {
        return { user: decodedClaims, profile: null }; // Treat as unauthorized
      }
      return { user: decodedClaims, profile };
    }

    return { user: decodedClaims, profile: null };
  } catch (error) {
    console.error("Session verification failed:", error);
    return { user: null, profile: null };
  }
}

export default async function AdminPage() {
  const { user, profile } = await getUserSession();

  if (!user || !profile) {
    redirect('/login');
  }

  const initialRole = profile?.role || 'staff';

  return <Dashboard initialRole={initialRole} />;
}
