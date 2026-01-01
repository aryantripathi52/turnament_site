'use client';

import { Hero } from '@/components/sections/hero';
import { PlayerDashboard } from '@/components/player/player-dashboard';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Skeleton className="h-32 w-1/2" />
      </div>
    );
  }

  return <div className="flex flex-col">{user ? <PlayerDashboard /> : <Hero />}</div>;
}
