'use client';

import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, orderBy, query, runTransaction, doc, serverTimestamp, increment } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AlertCircle, Calendar, ShieldCheck, Trophy, Gem, Users, Info } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tournament, Category, JoinedTournament, Registration } from '@/lib/types';
import { Button } from '../ui/button';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile } from '@/firebase/auth/use-user';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date.seconds) {
    return format(new Date(date.seconds * 1000), 'PPp');
  }
  if (date instanceof Date) {
    return format(date, 'PPp');
  }
  return 'Invalid Date';
};

export function PlayerTournamentList() {
  const firestore = useFirestore();
  const { user, profile, joinedTournaments, refreshJoinedTournaments } = useUser();
  const { toast } = useToast();

  const tournamentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments'), orderBy('startDate', 'desc'));
  }, [firestore]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: tournaments, isLoading: isLoadingTournaments, error: tournamentsError } = useCollection<Tournament>(tournamentsQuery);
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useCollection<Category>(categoriesQuery);

  const categoriesMap = useMemo(() => {
    if (!categories) return new Map<string, string>();
    return new Map(categories.map(cat => [cat.id, cat.name]));
  }, [categories]);

  const joinedTournamentIds = useMemo(() => {
    return new Set(joinedTournaments?.map(t => t.id));
  }, [joinedTournaments]);

  const availableTournaments = useMemo(() => {
    if (!tournaments) return [];
    return tournaments.filter(t => !joinedTournamentIds.has(t.id) && t.status === 'upcoming');
  }, [tournaments, joinedTournamentIds]);


  const isLoading = isLoadingTournaments || isLoadingCategories;
  const error = tournamentsError || categoriesError;

  const handleConfirmEntry = async (selectedTournament: WithId<Tournament>) => {
    if (!firestore || !user || !profile) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to join.' });
      return;
    }

    const userRef = doc(firestore, 'users', user.uid);
    const tournamentRef = doc(firestore, 'tournaments', selectedTournament.id);
    const registrationRef = doc(firestore, `tournaments/${selectedTournament.id}/registrations`, user.uid);
    
    try {
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const tournamentDoc = await transaction.get(tournamentRef);

        if (!userDoc.exists()) throw new Error("User profile not found.");
        if (!tournamentDoc.exists()) throw new Error("Tournament not found.");
        
        const userProfile = userDoc.data() as UserProfile;
        const currentTournament = tournamentDoc.data() as Tournament;

        if (userProfile.coins < currentTournament.entryFee) {
          throw new Error('Insufficient coins to enter the tournament.');
        }
        if (currentTournament.registeredCount >= currentTournament.maxPlayers) {
          throw new Error('This tournament is already full.');
        }
        if (currentTournament.status !== 'upcoming') {
          throw new Error('Registrations for this tournament are closed.');
        }

        const newSlotNumber = currentTournament.registeredCount + 1;

        // 1. Update user's coins
        transaction.update(userRef, { coins: increment(-currentTournament.entryFee) });
        
        // 2. Update tournament's registered count
        transaction.update(tournamentRef, { registeredCount: increment(1) });
        
        // 3. Create the public registration document
        const registrationData: Omit<Registration, 'id'> = {
            tournamentId: selectedTournament.id,
            userId: user.uid,
            teamName: profile.username,
            playerIds: [user.uid],
            registrationDate: serverTimestamp(),
            slotNumber: newSlotNumber
        };
        transaction.set(registrationRef, registrationData);
      });

      // TODO: Re-add the joinedTournaments write here, outside the transaction,
      // after its security rule has been added. For now, we prioritize fixing the join logic.
      refreshJoinedTournaments();

      toast({
        title: 'Registration Successful!',
        description: `You have entered "${selectedTournament.name}". Good luck!`,
      });

    } catch (e: any) {
      console.error("Tournament entry transaction failed:", e);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: e.message || 'An unexpected error occurred.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Tournaments</AlertTitle>
        <AlertDescription>
          There was a problem loading the tournaments. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!availableTournaments || availableTournaments.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        <p>No new tournaments are available at the moment.</p>
        <p className="text-sm mt-2">Check the "My Tournaments" tab for your joined events!</p>
      </div>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableTournaments.map((tournament) => {
         const isFull = tournament.registeredCount >= tournament.maxPlayers;
         const isRegistrationClosed = tournament.status !== 'upcoming';

        return (
          <AlertDialog key={tournament.id}>
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{tournament.name}</CardTitle>
                    <Badge variant="secondary">{categoriesMap.get(tournament.categoryId) || 'Unknown'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                 <p className="text-sm text-muted-foreground line-clamp-3">{tournament.description}</p>
                 <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span>
                            Prize: <span className="font-semibold">{tournament.prizePoolFirst.toLocaleString()} Coins</span> (1st)
                        </span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Gem className="h-4 w-4 text-muted-foreground" />
                        <span>
                            Entry Fee: <span className="font-semibold">{tournament.entryFee.toLocaleString()} coins</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Slots: <span className={cn("font-semibold", isFull && "text-destructive")}>{tournament.registeredCount} / {tournament.maxPlayers}</span>
                      </span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                            Starts: <span className="font-semibold">{formatDate(tournament.startDate)}</span>
                        </span>
                    </div>
                 </div>
              </CardContent>
              <CardFooter>
              {isFull ? (
                   <Button size="sm" className="w-full" disabled>
                      Tournament Full
                  </Button>
              ) : isRegistrationClosed ? (
                  <Button size="sm" className="w-full" disabled>
                      Registration Closed
                  </Button>
              ) : (
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="w-full" disabled={(profile?.coins ?? 0) < tournament.entryFee}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      {(profile?.coins ?? 0) < tournament.entryFee ? "Insufficient Coins" : "Enter Tournament"}
                    </Button>
                  </AlertDialogTrigger>
              )}
              </CardFooter>
            </Card>

            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Confirm Tournament Entry</AlertDialogTitle>
                <AlertDialogDescription>
                    Are you sure you want to enter the <span className="font-semibold text-foreground">"{tournament?.name}"</span>? 
                    The entry fee of <span className="font-semibold text-foreground">{tournament?.entryFee.toLocaleString()} coins</span> will be deducted from your wallet. This action cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleConfirmEntry(tournament)}>Confirm Entry</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )
      })}
    </div>
    </>
  );
}
