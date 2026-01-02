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
    if (!user || !firestore || profile?.role !== 'player') {
      setIsTournamentsLoading(false);
      setJoinedTournaments([]);
      setWonTournaments([]);
      return;
    }

    setIsTournamentsLoading(true);
    setTournamentsError(null);

    const joinedQuery = query(collection(firestore, 'users', user.uid, 'joinedTournaments'), orderBy('startDate', 'desc'));
    const wonQuery = query(collection(firestore, 'users', user.uid, 'wonTournaments'), orderBy('completionDate', 'desc'));

    const unsubscribes: Unsubscribe[] = [];

    const joinedUnsubscribe = onSnapshot(joinedQuery,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() as JoinedTournament, id: doc.id }));
        setJoinedTournaments(data);
      },
      (error) => {
        console.error("Error fetching joined tournaments:", error);
        setTournamentsError(error);
        setJoinedTournaments([]);
      }
    );
    unsubscribes.push(joinedUnsubscribe);

    const wonUnsubscribe = onSnapshot(wonQuery,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data() as WonTournament, id: doc.id }));
        setWonTournaments(data);
      },
      (error) => {
        console.error("Error fetching won tournaments:", error);
        setTournamentsError(error);
        setWonTournaments([]);
      }
    );
    unsubscribes.push(wonUnsubscribe);
    
    // Once both listeners are attached (or have errored), loading is complete for this stage.
    // We can't know exactly when the *first* data comes back, so we'll stop loading here.
    // The UI will handle the null -> data transition.
    Promise.allSettled([new Promise(res => onSnapshot(joinedQuery, res)), new Promise(res => onSnapshot(wonQuery, res))])
        .then(() => setIsTournamentsLoading(false));


    return () => unsubscribes.forEach(unsub => unsub());

  }, [user, firestore, profile, refreshKey]);


  const refreshJoinedTournaments = useCallback(() => {
    setRefreshKey(oldKey => oldKey + 1);
  }, []);

  const isOverallLoading = isAuthLoading || isProfileLoading;
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
