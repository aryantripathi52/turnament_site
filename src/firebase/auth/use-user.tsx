'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { doc, collection, query, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { JoinedTournament, WonTournament, UserProfile } from '@/lib/types';
import { useMemoFirebase } from '../provider';

// Define the shape of the user profile document in Firestore
export interface UserHookResult {
  user: FirebaseUser | null;
  profile: WithId<UserProfile> | null;
  isUserLoading: boolean; // Covers auth and profile loading
  isProfileLoading: boolean; // Specific to profile
  userError: Error | null;
  joinedTournaments: WithId<JoinedTournament>[] | null;
  wonTournaments: WithId<WonTournament>[] | null;
  isTournamentsLoading: boolean; // Specific to tournament lists
  tournamentsError: Error | null; // Specific to tournament lists
  refreshJoinedTournaments: () => void;
}

/**
 * Hook for accessing the authenticated user's state and their Firestore profile.
 * This provides the Firebase User object, loading status, auth errors, and profile data.
 * @returns {UserHookResult} Object with user, profile, loading states, and error.
 */
export const useUser = (): UserHookResult => {
  const {
    user,
    isUserLoading: isAuthLoading,
    userError: authError,
    firestore,
  } = useFirebase();

  const [refreshKey, setRefreshKey] = useState(0);

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

  const [joinedTournaments, setJoinedTournaments] = useState<WithId<JoinedTournament>[] | null>(null);
  const [wonTournaments, setWonTournaments] = useState<WithId<WonTournament>[] | null>(null);
  const [isTournamentsLoading, setIsTournamentsLoading] = useState(true);
  const [tournamentsError, setTournamentsError] = useState<Error | null>(null);


  useEffect(() => {
    if (!user || !firestore) {
      setIsTournamentsLoading(false);
      return;
    }
    
    // Only fetch tournaments if the profile is loaded and the user is a player
    if (!isProfileLoading && profile && profile.role !== 'player') {
      setIsTournamentsLoading(false);
      setJoinedTournaments([]);
      setWonTournaments([]);
      return;
    }

    // Don't start fetching until the profile is available
    if (isProfileLoading || !profile) {
        return;
    }

    // Start loading and clear previous errors
    setIsTournamentsLoading(true);
    setTournamentsError(null);

    // Set up the queries
    const joinedQuery = query(collection(firestore, `users/${user.uid}/joinedTournaments`), orderBy('startDate', 'desc'));
    const wonQuery = query(collection(firestore, `users/${user.uid}/wonTournaments`), orderBy('completionDate', 'desc'));

    let joinedUnsubscribe: Unsubscribe | null = null;
    let wonUnsubscribe: Unsubscribe | null = null;
    let active = true; // Flag to prevent state updates on unmounted component

    // Listener for joined tournaments
    joinedUnsubscribe = onSnapshot(joinedQuery,
      (snapshot) => {
        if (!active) return;
        const data = snapshot.docs.map(doc => ({ ...doc.data() as JoinedTournament, id: doc.id }));
        setJoinedTournaments(data);
        setIsTournamentsLoading(false); // Stop loading once we have data
      },
      (error) => {
        if (!active) return;
        console.error("Snapshot Error (Joined Tournaments):", error);
        setTournamentsError(error);
        setJoinedTournaments([]);
        setIsTournamentsLoading(false);
      }
    );

    // Listener for won tournaments
    wonUnsubscribe = onSnapshot(wonQuery,
      (snapshot) => {
        if (!active) return;
        const data = snapshot.docs.map(doc => ({ ...doc.data() as WonTournament, id: doc.id }));
        setWonTournaments(data);
      },
      (error) => {
        if (!active) return;
        console.error("Snapshot Error (Won Tournaments):", error);
        // We can choose to set a global error or handle it separately
        setWonTournaments([]);
      }
    );

    // Cleanup function to unsubscribe from listeners when the component unmounts
    // or when dependencies change.
    return () => {
      active = false;
      if (joinedUnsubscribe) joinedUnsubscribe();
      if (wonUnsubscribe) wonUnsubscribe();
    };

  }, [user, firestore, profile, isProfileLoading, refreshKey]);


  const refreshJoinedTournaments = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const isOverallLoading = isAuthLoading || (!!user && isProfileLoading);
  const overallError = authError || profileError;

  return {
    user,
    profile,
    joinedTournaments,
    wonTournaments,
    isUserLoading: isOverallLoading,
    isProfileLoading,
    userError: overallError,
    isTournamentsLoading,
    tournamentsError,
    refreshJoinedTournaments,
  };
};
