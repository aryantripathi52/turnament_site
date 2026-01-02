'use client';

import { useMemo, useState, useEffect } from 'react';
import { useFirebase, useMemoFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { useCollection } from '@/firebase/firestore/use-collection';
import { doc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
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

  const [coinRequests, setCoinRequests] = useState<WithId<CoinRequest>[] | null>(null);
  const [areCoinRequestsLoading, setAreCoinRequestsLoading] = useState(true);
  const [coinRequestsError, setCoinRequestsError] = useState<Error | null>(null);


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

  useEffect(() => {
    if (!user || !firestore) {
      setCoinRequests(null);
      setAreCoinRequestsLoading(false);
      return;
    }

    const fetchCoinRequests = async () => {
      setAreCoinRequestsLoading(true);
      try {
        const q = query(collection(firestore, 'coinRequests'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<CoinRequest>));
        
        requests.sort((a, b) => {
            const dateA = a.requestDate instanceof Timestamp ? a.requestDate.toMillis() : 0;
            const dateB = b.requestDate instanceof Timestamp ? b.requestDate.toMillis() : 0;
            return dateB - dateA;
        });

        setCoinRequests(requests);
        setCoinRequestsError(null);
      } catch (err: any) {
        console.error("Error fetching coin requests:", err);
        setCoinRequestsError(err);
      } finally {
        setAreCoinRequestsLoading(false);
      }
    };

    fetchCoinRequests();
  }, [user, firestore]);
  

  return {
    user,
    profile,
    coinRequests,
    isUserLoading,
    isProfileLoading: isUserLoading || isProfileLoading || areCoinRequestsLoading,
    userError: userError || profileError || coinRequestsError,
  };
};
