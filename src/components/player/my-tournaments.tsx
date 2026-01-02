'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Swords, Calendar, Info } from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import type { Tournament } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

interface JoinedTournament extends Tournament {
  registrationDate: Date;
}

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.seconds) {
    return format(new Date(date.seconds * 1000), 'PP');
  }
  if (date instanceof Date) {
    return format(date, 'PP');
  }
  return 'Invalid Date';
};


export function MyTournaments() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [joinedTournaments, setJoinedTournaments] = useState<JoinedTournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJoinedTournaments = async () => {
      if (!user || !firestore) {
        setIsLoading(false);
        return;
      };

      setIsLoading(true);
      setError(null);

      try {
        // 1. Find all registrations for the current user
        const registrationsQuery = query(
          collectionGroup(firestore, 'registrations'),
          where('playerIds', 'array-contains', user.uid)
        );
        const registrationSnap = await getDocs(registrationsQuery);

        if (registrationSnap.empty) {
          setJoinedTournaments([]);
          setIsLoading(false);
          return;
        }

        // 2. For each registration, fetch the corresponding tournament details
        const tournamentPromises = registrationSnap.docs.map(async (regDoc) => {
          const registrationData = regDoc.data();
          const tournamentRef = doc(firestore, 'tournaments', registrationData.tournamentId);
          const tournamentSnap = await getDoc(tournamentRef);

          if (tournamentSnap.exists()) {
            const tournamentData = tournamentSnap.data() as Tournament;
            return {
              ...tournamentData,
              id: tournamentSnap.id,
              registrationDate: registrationData.registrationDate.toDate(),
            };
          }
          return null;
        });

        const tournaments = (await Promise.all(tournamentPromises)).filter(t => t !== null) as JoinedTournament[];
        
        // Sort by most recent registration
        tournaments.sort((a, b) => b.registrationDate.getTime() - a.registrationDate.getTime());

        setJoinedTournaments(tournaments);

      } catch (e: any) {
        console.error("Error fetching joined tournaments:", e);
        setError("Failed to load your tournaments. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchJoinedTournaments();
  }, [user, firestore]);

  const wonTournaments = []; // Placeholder for now

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
    )
  }

  if (error) {
    return <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
    </Alert>
  }


  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="h-6 w-6 text-primary" />
            Joined Tournaments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {joinedTournaments.length > 0 ? (
            <div className="space-y-4">
              {joinedTournaments.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 border rounded-md">
                  <div>
                    <p className="font-semibold text-lg">{t.name}</p>
                     <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>Starts: {formatDate(t.startDate)}</span>
                    </p>
                  </div>
                   <Badge variant="outline">Joined: {format(t.registrationDate, 'PP')}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                 <p className="font-semibold text-lg mb-2">You haven't joined any tournaments yet.</p>
                 <p>What are you waiting for? Join now and start winning!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Tournament Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {wonTournaments.length > 0 ? (
            <div className="space-y-4">
              {wonTournaments.map((t: any) => (
                <div key={t.id} className="flex justify-between items-center p-4 border rounded-md bg-yellow-500/10">
                    <div>
                        <p className="font-semibold">{t.name}</p>
                        <p className="text-sm text-yellow-600">{t.placement}</p>
                    </div>
                  <span className="font-bold text-yellow-500">+{t.prize.toLocaleString()} Coins</span>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                <p className="font-semibold text-lg mb-2">No tournament wins recorded yet.</p>
                <p>Keep playing to see your victories here!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
