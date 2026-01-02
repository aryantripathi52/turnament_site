'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { doc, collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
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

  // --- Fetch Coin Requests (only for players) ---
  const addCoinRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore || profile?.role !== 'player') return null;
    return query(collection(firestore, "addCoinRequests"), where("userId", "==", user.uid), orderBy("requestDate", "desc"));
  }, [user, firestore, profile]);

  const withdrawCoinRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore || profile?.role !== 'player') return null;
    return query(collection(firestore, "withdrawCoinRequests"), where("userId", "==", user.uid), orderBy("requestDate", "desc"));
  }, [user, firestore, profile]);

  const {data: addCoinRequests, isLoading: isAddLoading, error: addError } = useCollection<CoinRequest>(addCoinRequestsQuery);
  const {data: withdrawCoinRequests, isLoading: isWithdrawLoading, error: withdrawError } = useCollection<CoinRequest>(withdrawCoinRequestsQuery);
  const [coinRequests, setCoinRequests] = useState<WithId<CoinRequest>[] | null>(null);

  useEffect(() => {
    if (addCoinRequests || withdrawCoinRequests) {
        const combined = [...(addCoinRequests || []), ...(withdrawCoinRequests || [])];
        combined.sort((a, b) => (b.requestDate?.seconds || 0) - (a.requestDate?.seconds || 0));
        setCoinRequests(combined);
    }
  }, [addCoinRequests, withdrawCoinRequests]);


  // --- Fetch Joined Tournaments ---
  const joinedTournamentsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'users', user.uid, 'joinedTournaments'), orderBy('startDate', 'desc'));
  }, [user, firestore]);

  const { data: joinedTournaments, isLoading: isTournamentsLoading, error: tournamentsError } = useCollection<JoinedTournament>(joinedTournamentsQuery);


  const combinedIsLoading = isUserLoading || isProfileLoading || isAddLoading || isWithdrawLoading || isTournamentsLoading;
  const combinedError = userError || profileError || addError || withdrawError || tournamentsError;

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
