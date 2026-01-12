'use client';
import { PlayerDashboard } from '@/components/player/player-dashboard';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function PlayerPage() {
  const { user, profile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is determined

    if (!user) {
      // If not logged in, redirect to login page
      router.replace('/login');
      return;
    }

    if (profile && (profile.role === 'admin' || profile.role === 'staff')) {
        // If user is admin/staff, they don't belong here. Redirect them.
        router.replace('/admin');
    }
  }, [user, profile, isUserLoading, router]);

  // Show a loading skeleton while user/profile is loading or if the role is not 'player' yet
  if (isUserLoading || !profile || profile.role !== 'player') {
    return (
        <div className="container mx-auto py-8">
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
  }

  // Once everything is loaded and role is correct, render the dashboard
  return <PlayerDashboard />;
}
