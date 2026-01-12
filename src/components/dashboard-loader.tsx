
'use client';

import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { PlayerDashboard } from '@/components/player/player-dashboard';
import { StaffDashboard } from '@/components/staff/staff-dashboard';
import { useUser } from '@/firebase';

interface DashboardProps {
  initialRole: 'admin' | 'staff' | 'player' | null;
}

/**
 * This client component receives the user's role from the server
 * and renders the appropriate dashboard, ensuring all client-side
 * hooks like `useUser` have the necessary context.
 */
export default function Dashboard({ initialRole }: DashboardProps) {
  const { profile } = useUser();

  // Prefer the real-time client-side profile role if available,
  // otherwise fall back to the role determined by the server.
  const role = profile?.role || initialRole;

  if (role === 'admin') {
    return <AdminDashboard />;
  }

  if (role === 'staff') {
    return <StaffDashboard />;
  }

  // Default to player dashboard
  return <PlayerDashboard />;
}
