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
    if (!auth?.currentUser || !user || !profile || !db) {
        toast({ variant: "destructive", title: "Authentication Error", description: "You must be logged in to join." });
        return;
    }
    
    if (profile.coins < selectedTournament.entryFee) {
       toast({ variant: "destructive", title: "Join Failed", description: "Insufficient coins to enter." });
       return;
    }
    
    const uid = auth.currentUser.uid;
    const tid = selectedTournament.id;
    const fee = selectedTournament.entryFee;
    
    console.log('--- PRE-FLIGHT CHECK ---');
    console.log('Current UID:', uid);
    console.log('Tournament ID:', tid);
    console.log('------------------------');

    if (!uid || !tid) {
      toast({ variant: "destructive", title: "Join Failed", description: "User or Tournament ID is missing." });
      return;
    }
    
    try {
        const tournamentUpdate = { registeredCount: increment(1) };
        
        console.log("Step 1: Updating tournament registered count...");
        await updateDoc(doc(db, "tournaments", tid), tournamentUpdate);
        console.log("Step 1 PASSED: Tournament count incremented.");

        console.log("Step 2: Creating registration document...");
        await setDoc(doc(db, "tournaments", tid, "registrations", uid), {
            userId: uid,
            teamName: profile.username,
            registrationDate: serverTimestamp(),
            slotNumber: (selectedTournament.registeredCount || 0) + 1,
        });
        console.log("Step 2 PASSED: Registration document created.");
        
        console.log("Step 3: Deducting coins from user...");
        await updateDoc(doc(db, "users", uid), {
            coins: increment(-fee)
        });
        console.log("Step 3 PASSED: Coins deducted.");

        // Post-Success Client-Side Updates
        const finalTournamentState = await getDoc(doc(db, "tournaments", tid));
        const finalSlotNumber = finalTournamentState.data()?.registeredCount || 1;
        const joinedTournamentData: Omit<JoinedTournament, 'id'> = {
            name: selectedTournament.name,
            startDate: selectedTournament.startDate,
            prizePoolFirst: selectedTournament.prizePoolFirst,
            entryFee: selectedTournament.entryFee,
            slotNumber: finalSlotNumber,
            roomId: selectedTournament.roomId || null,
            roomPassword: selectedTournament.roomPassword || null
        };
        await setDoc(doc(db, "users", uid, "joinedTournaments", tid), joinedTournamentData);
        
        refreshJoinedTournaments();
        
        toast({
            title: 'Success!',
            description: `You have successfully joined "${selectedTournament.name}".`,
        });

    } catch (e: any) {
        console.error("--- JOIN FAILED ---");
        console.error("CRITICAL JOIN ERROR:", e);
        console.error("Error Code:", e.code);
        console.error("Error Message:", e.message);
        console.error("-------------------");
        toast({
            variant: "destructive",
            title: 'Join Failed',
            description: e.message || "An unexpected error occurred. Check the console for details.",
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
