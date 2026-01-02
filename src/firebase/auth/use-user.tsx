'use client';

import { useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { JoinedTournament } from '@/lib/types';
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

// This hook result is now simplified. Components will fetch their own specific data.
export interface UserHookResult {
  user: FirebaseUser | null;
  profile: WithId<UserProfile> | null;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  userError: Error | null;
  joinedTournaments: WithId<JoinedTournament>[] | null;
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

  // --- Fetch Joined Tournaments (Player-specific) ---
  const joinedTournamentsQuery = useMemoFirebase(() => {
    if (isProfileLoading || !user || !firestore || profile?.role !== 'player') return null;
    return query(collection(firestore, 'users', user.uid, 'joinedTournaments'), orderBy('startDate', 'desc'));
  }, [user, firestore, profile, isProfileLoading]);

  const { data: joinedTournaments, isLoading: isTournamentsLoading, error: tournamentsError } = useCollection<JoinedTournament>(joinedTournamentsQuery);

  const combinedIsLoading = isUserLoading || isProfileLoading || isTournamentsLoading;
  const combinedError = userError || profileError || tournamentsError;

  return {
    user,
    profile,
    joinedTournaments,
    isUserLoading: combinedIsLoading,
    isProfileLoading: combinedIsLoading, 
    userError: combinedError,
  };
};
