'use client';

import { useMemo } from 'react';
import { useFirebase } from '@/firebase/provider';
import { useDoc, type WithId } from '@/firebase/firestore/use-doc';
import { doc, collection, query, where, getDocs, Timestamp, orderBy } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CoinRequest } from '@/lib/types';
import { useMemoFirebase } from '../provider';
import { useCollection } from '../firestore/use-collection';
import { useEffect, useState } from 'react';


// Define the shape of the user profile document in Firestore
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'staff' | 'player';
  registrationIds: string[];
  coins: number;
  status: 'active' | 'blocked';
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

  const [coinRequests, setCoinRequests] = useState<WithId<CoinRequest>[] | null>(null);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<Error | null>(null);


  useEffect(() => {
    const fetchRequests = async () => {
      if (!user || !firestore || profile?.role !== 'player') {
        setCoinRequests(null);
        return;
      }
      setRequestsLoading(true);
      try {
        const q = query(collection(firestore, "coinRequests"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WithId<CoinRequest>));
        // Sort client-side
        requests.sort((a, b) => b.requestDate.toMillis() - a.requestDate.toMillis());
        setCoinRequests(requests);
      } catch (e: any) {
        console.error("Failed to fetch coin requests:", e);
        setRequestsError(e);
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchRequests();
  }, [user, firestore, profile]);
  
  return {
    user,
    profile,
    coinRequests,
    isUserLoading,
    isProfileLoading: isUserLoading || isProfileLoading || requestsLoading,
    userError: userError || profileError || requestsError,
  };
};

    