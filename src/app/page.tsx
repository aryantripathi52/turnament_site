'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Hero } from '@/components/sections/hero';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, profile, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while loading
    if (isUserLoading) return; 

    // If loading is finished and we have a user and profile, redirect.
    if (user && profile) {
      if (profile.role === 'admin' || profile.role === 'staff') {
        router.replace('/admin');
      } else {
        router.replace('/player');
      }
    }
    
    // If loading is finished and there's no user, the page will just render the Hero component.
    
  }, [user, profile, isUserLoading, router]);

  // Show a loading screen while we determine the user's auth state.
  if (isUserLoading) {
    return (
       <div className="h-screen w-full flex items-center justify-center">
            <div className="space-y-4 max-w-4xl mx-auto w-full p-4">
                <Skeleton className="h-16 w-1/2 mx-auto" />
                <Skeleton className="h-8 w-3/4 mx-auto" />
                 <div className="flex justify-center gap-4 pt-4">
                    <Skeleton className="h-12 w-32" />
                 </div>
            </div>
       </div>
    );
  }

  // If not loading and not logged in (or no profile), show the public landing page.
  return <Hero />;
}
