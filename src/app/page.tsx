'use client';

import { Hero } from '@/components/sections/hero';
import { PlayerDashboard } from '@/components/player/player-dashboard';
import { useUser } from '@/firebase/auth/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboard } from '@/components/admin/admin-dashboard';

export default function Home() {
  const { user, profile, isUserLoading, isProfileLoading } = useUser();

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Skeleton className="h-32 w-1/2" />
      </div>
    );
  }

  if (!user) {
    return <Hero />;
  }

  if (profile?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <PlayerDashboard />;
}
