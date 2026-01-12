'use client';
import { PlayerDashboard } from '@/components/player/player-dashboard';
import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { StaffDashboard } from '@/components/staff/staff-dashboard';

export default function AdminPage() {
  const { user, profile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is determined

    if (!user) {
      // If not logged in, redirect to login page
      router.replace('/login');
      return;
    }

    if (profile && profile.role === 'player') {
      // If user is a player, they don't belong here. Redirect them.
      router.replace('/player');
    }
    
  }, [user, profile, isUserLoading, router]);

  if (isUserLoading || !profile) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-24 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  if (profile.role === 'staff') {
    return <StaffDashboard />;
  }

  // Fallback for the brief moment before redirect happens
  return (
    <div className="container mx-auto py-8">
      <Skeleton className="h-24 w-full mb-6" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
