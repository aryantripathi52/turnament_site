'use client';

import { useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, orderBy, query, updateDoc, doc, serverTimestamp, increment, getDoc, Timestamp, setDoc, writeBatch, runTransaction } from 'firebase/firestore';
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
import type { Tournament, Category, JoinedTournament, Registration, UserProfile } from '@/lib/types';
import { Button } from '../ui/button';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { useToast } from '@/hooks/use-toast';
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
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'PPp');
  }
  return 'Invalid Date';
};

export function PlayerTournamentList() {
  const auth = useAuth();
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
    const db = firestore;
    if (!auth?.currentUser || !user || !profile) {
      toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to join." });
      return;
    }
    const userId = user.uid;
    const tournamentId = selectedTournament.id;

    // Preliminary client-side checks
    if (profile.coins < selectedTournament.entryFee) {
       toast({ variant: "destructive", title: "Join Failed", description: "Insufficient coins to enter." });
       return;
    }
     if (selectedTournament.registeredCount >= selectedTournament.maxPlayers) {
        toast({ variant: "destructive", title: "Join Failed", description: "This tournament is already full." });
        return;
    }
    if (selectedTournament.status !== 'upcoming') {
        toast({ variant: "destructive", title: "Join Failed", description: "Registrations for this tournament are closed." });
        return;
    }

    try {
        const tournamentDoc = await getDoc(doc(db, "tournaments", tournamentId));
        if (!tournamentDoc.exists()) {
          throw new Error("Tournament not found.");
        }
        const currentRegisteredCount = tournamentDoc.data()?.registeredCount || 0;
        const newSlotNumber = currentRegisteredCount + 1;
        
        const batch = writeBatch(db);

        // 1. Create Registration Document
        const registrationRef = doc(db, "tournaments", tournamentId, "registrations", userId);
        const registrationData: Omit<Registration, 'id' | 'registrationDate'> = {
            userId: userId,
            tournamentId: tournamentId,
            teamName: profile.username,
            playerIds: [userId],
            slotNumber: newSlotNumber,
        };
        batch.set(registrationRef, {
            ...registrationData,
            registrationDate: serverTimestamp(),
        });
        
        // 2. Create User's Private Joined Tournament Document
        const joinedTournamentRef = doc(db, "users", userId, "joinedTournaments", tournamentId);
        const joinedTournamentData: Omit<JoinedTournament, 'id'> = {
            name: selectedTournament.name,
            startDate: selectedTournament.startDate,
            prizePoolFirst: selectedTournament.prizePoolFirst,
            entryFee: selectedTournament.entryFee,
            slotNumber: newSlotNumber,
            roomId: selectedTournament.roomId || null,
            roomPassword: selectedTournament.roomPassword || null
        };
        batch.set(joinedTournamentRef, joinedTournamentData);

        // 3. Update Tournament (Increment registeredCount)
        const tournamentRef = doc(db, "tournaments", tournamentId);
        batch.update(tournamentRef, {
            registeredCount: increment(1)
        });
        
        // 4. Update User Profile (Deduct Coins)
        const userRef = doc(db, "users", userId);
        batch.update(userRef, {
            coins: increment(-selectedTournament.entryFee)
        });
        
        // Commit all writes in a single batch
        await batch.commit();

        refreshJoinedTournaments(); 
        toast({
            title: 'Success!',
            description: `You have successfully joined "${selectedTournament.name}".`,
        });

    } catch (error: any) {
        console.error("CRITICAL JOIN FAIL:", error);
        toast({
            variant: "destructive",
            title: 'Join Failed',
            description: error.message || "An unexpected error occurred. Check security rules and Firestore logs.",
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
                            Prize: <span className="font-semibold">{tournament.prizePoolFirst.toLocaleString()}</span> (1st)
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
