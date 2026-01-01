'use client';

import { useMemo } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { doc, collection, query, where } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CoinRequest } from '@/lib/types';

// Define the shape of the user profile document in Firestore
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'player';
  registrationIds: string[];
  coins: number;
}

export interface UserHookResult {
  user: FirebaseUser | null;
  profile: WithId<UserProfile> | null;
  coinRequests: WithId<CoinRequest>[] | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  userError: Error | null;
}

/**
 * Hook for accessing the authenticated user's state and their Firestore profile.
 * This provides the Firebase User object, loading status, auth errors, and profile data.
 * @returns {UserHookResult} Object with user, profile, loading states, and error.
 */
export const useUser = (): UserHookResult => {
  const {
    user,
    isUserLoading,
    userError,
    firestore,
  } = useFirebase();

  // Memoize the document reference to prevent re-renders
  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useDoc<UserProfile>(userProfileRef);

  // Create a memoized query for the user's coin requests
  const coinRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'coinRequests'), where('userId', '==', user.uid));
  }, [user, firestore]);

  const {
    data: coinRequests,
    isLoading: areCoinRequestsLoading,
    error: coinRequestsError,
  } = useCollection<CoinRequest>(coinRequestsQuery);

  return {
    user,
    profile,
    coinRequests,
    isUserLoading,
    isProfileLoading: isUserLoading || isProfileLoading || areCoinRequestsLoading,
    userError: userError || profileError || coinRequestsError,
  };
};
