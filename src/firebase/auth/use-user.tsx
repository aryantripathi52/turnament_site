'use client';

import { useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { doc, collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CoinRequest, JoinedTournament } from '@/lib/types';
import { useMemoFirebase } from '../provider';
import { useCollection } from '../firestore/use-collection';


// Define the shape of the user profile document in Firestore
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'player';
  coins: number;
}

export interface UserHookResult {
  user: FirebaseUser | null;
  profile: WithId<UserProfile> | null;
  coinRequests: WithId<CoinRequest>[] | null;
  joinedTournaments: WithId<JoinedTournament>[] | null;
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

  // --- Fetch Coin Requests ---
  const coinRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "coinRequests"), where("userId", "==", user.uid), orderBy("requestDate", "desc"));
  }, [user, firestore]);

  const {data: coinRequests, isLoading: isCoinRequestsLoading, error: coinRequestsError } = useCollection<CoinRequest>(coinRequestsQuery);

  // --- Fetch Joined Tournaments ---
  const joinedTournamentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'joinedTournaments'), orderBy('startDate', 'desc'));
  }, [user, firestore]);

  const { data: joinedTournaments, isLoading: isTournamentsLoading, error: tournamentsError } = useCollection<JoinedTournament>(joinedTournamentsQuery);


  const combinedIsLoading = isUserLoading || isProfileLoading || isCoinRequestsLoading || isTournamentsLoading;
  const combinedError = userError || profileError || coinRequestsError || tournamentsError;

  return {
    user,
    profile,
    coinRequests,
    joinedTournaments,
    isUserLoading: combinedIsLoading,
    isProfileLoading: combinedIsLoading,
    userError: combinedError,
  };
};
