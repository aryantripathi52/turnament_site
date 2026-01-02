'use client';

import { useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { doc, collection, query, where, getDocs, Timestamp, getDoc, collectionGroup } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CoinRequest, Registration, Tournament } from '@/lib/types';
import { useMemoFirebase } from '../provider';
import { useEffect, useState } from 'react';


// Define the shape of the user profile document in Firestore
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'player';
  coins: number;
  registrationIds?: string[];
}

export interface JoinedTournament extends WithId<Tournament> {
    registrationId: string;
}

export interface UserHookResult {
  user: FirebaseUser | null;
  profile: WithId<UserProfile> | null;
  coinRequests: WithId<CoinRequest>[] | null;
  joinedTournaments: JoinedTournament[] | null;
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

  // --- State for combined data ---
  const [coinRequests, setCoinRequests] = useState<WithId<CoinRequest>[] | null>(null);
  const [joinedTournaments, setJoinedTournaments] = useState<JoinedTournament[] | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<Error | null>(null);


  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !firestore) {
        setCoinRequests(null);
        setJoinedTournaments(null);
        return;
      }
      setDataLoading(true);
      try {
        // --- Fetch Coin Requests ---
        const requestsQuery = query(collection(firestore, "coinRequests"), where("userId", "==", user.uid));
        const requestsSnapshot = await getDocs(requestsQuery);
        const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<CoinRequest>));
        requests.sort((a, b) => {
            const dateA = a.requestDate instanceof Timestamp ? a.requestDate.toMillis() : 0;
            const dateB = b.requestDate instanceof Timestamp ? b.requestDate.toMillis() : 0;
            return dateB - dateA;
        });
        setCoinRequests(requests);

        // --- Fetch Joined Tournaments ---
        const registrationsQuery = query(collectionGroup(firestore, 'registrations'), where('playerIds', 'array-contains', user.uid));

        const registrationsSnapshot = await getDocs(registrationsQuery);
        const registrations = registrationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as WithId<Registration>);
        
        const tournamentPromises = registrations.map(async (reg) => {
            const tournamentRef = doc(firestore, 'tournaments', reg.tournamentId);
            const tournamentSnap = await getDoc(tournamentRef);
            if (tournamentSnap.exists()) {
                return {
                    ...(tournamentSnap.data() as Tournament),
                    id: tournamentSnap.id,
                    registrationId: reg.id
                } as JoinedTournament;
            }
            return null;
        });

        const tournaments = (await Promise.all(tournamentPromises)).filter(t => t !== null) as JoinedTournament[];
        setJoinedTournaments(tournaments);

      } catch (e: any) {
        setDataError(e);
      } finally {
        setDataLoading(false);
      }
    };
    fetchUserData();
  }, [user, firestore, profile]); // Rerun when profile changes (e.g., registrationIds get updated)


  const combinedIsLoading = isUserLoading || isProfileLoading || dataLoading;
  const combinedError = userError || profileError || dataError;

  return {
    user,
    profile,
    coinRequests,
    joinedTournaments,
    isUserLoading,
    isProfileLoading: combinedIsLoading,
    userError: combinedError,
  };
};

    