'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, writeBatch, serverTimestamp, increment, Timestamp } from 'firebase/firestore';
import type { Tournament, Registration, UserProfile, WonTournament } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, User, Crown, Medal, Trophy } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

interface ManageTournamentDialogProps {
  tournament: WithId<Tournament>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTournamentUpdate: (updatedTournament: WithId<Tournament>) => void;
}

const NA_VALUE = 'N/A';

export function ManageTournamentDialog({ tournament, isOpen, setIsOpen, onTournamentUpdate }: ManageTournamentDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [firstPlace, setFirstPlace] = useState<string | undefined>(tournament.winners?.first?.userId);
  const [secondPlace, setSecondPlace] = useState<string | undefined>(tournament.winners?.second?.userId ?? NA_VALUE);
  const [thirdPlace, setThirdPlace] = useState<string | undefined>(tournament.winners?.third?.userId ?? NA_VALUE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFirstPlace(tournament.winners?.first?.userId);
    setSecondPlace(tournament.winners?.second?.userId ?? NA_VALUE);
    setThirdPlace(tournament.winners?.third?.userId ?? NA_VALUE);
  }, [tournament]);

  const registrationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments', tournament.id, 'registrations'), orderBy('registrationDate', 'asc'));
  }, [firestore, tournament.id]);

  const { data: registrations, isLoading, error } = useCollection<Registration>(registrationsQuery);
  
  const isCompleted = tournament.status === 'completed';

  const players = useMemo(() => {
    if (isCompleted && tournament.winners) {
        const winnerList = [];
        if (tournament.winners.first) winnerList.push({ id: tournament.winners.first.userId, name: tournament.winners.first.username });
        if (tournament.winners.second) winnerList.push({ id: tournament.winners.second.userId, name: tournament.winners.second.username });
        if (tournament.winners.third) winnerList.push({ id: tournament.winners.third.userId, name: tournament.winners.third.username });
        return winnerList;
    }
    return registrations?.map(reg => ({ id: reg.userId, name: reg.teamName })) || [];
  }, [registrations, isCompleted, tournament.winners]);
  
  const getPlayerName = (userId: string | undefined) => {
    if (!userId || userId === NA_VALUE) return 'N/A';
    return players.find(p => p.id === userId)?.name || 'Unknown';
  }

  const handleSubmitWinners = async () => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }
    if (!firstPlace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a winner for 1st place.' });
      return;
    }

    const selectedWinners = [firstPlace, secondPlace, thirdPlace].filter(p => p && p !== NA_VALUE);
    if (new Set(selectedWinners).size !== selectedWinners.length) {
      toast({ variant: 'destructive', title: 'Error', description: 'Each winner must be a unique player.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const completionTimestamp = serverTimestamp();
      
      const winnersPayload: Tournament['winners'] = {
        first: { userId: firstPlace, username: getPlayerName(firstPlace) },
      };
      
      const prizeMap = new Map([
          [firstPlace, { prize: tournament.prizePoolFirst, place: '1st' }],
      ]);

      if (secondPlace && secondPlace !== NA_VALUE) {
        winnersPayload.second = { userId: secondPlace, username: getPlayerName(secondPlace) };
        prizeMap.set(secondPlace, { prize: tournament.prizePoolSecond, place: '2nd' });
      }

      if (thirdPlace && thirdPlace !== NA_VALUE) {
        winnersPayload.third = { userId: thirdPlace, username: getPlayerName(thirdPlace) };
        prizeMap.set(thirdPlace, { prize: tournament.prizePoolThird, place: '3rd' });
      }

      const tournamentRef = doc(firestore, 'tournaments', tournament.id);
      batch.update(tournamentRef, { winners: winnersPayload, status: 'completed' });

      for (const [userId, { prize, place }] of prizeMap.entries()) {
        const userRef = doc(firestore, 'users', userId);
        const joinedTournamentRef = doc(firestore, 'users', userId, 'joinedTournaments', tournament.id);
        const wonTournamentRef = doc(firestore, 'users', userId, 'wonTournaments', tournament.id);

        batch.update(userRef, { coins: increment(prize) });
        batch.delete(joinedTournamentRef);
        
        const wonTournamentData: Omit<WonTournament, 'id'> = {
            name: tournament.name,
            prizeWon: prize,
            place: place as WonTournament['place'],
            completionDate: completionTimestamp
        };
        batch.set(wonTournamentRef, wonTournamentData);
      }

      await batch.commit();

      toast({ title: 'Success!', description: 'Winners have been set and prizes have been paid out.' });
      onTournamentUpdate({ ...tournament, status: 'completed', winners: winnersPayload });
      setIsOpen(false);

    } catch (e) {
      console.error("Error setting winners:", e);
      toast({ variant: 'destructive', title: 'Operation Failed', description: 'Could not set winners. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading && !isCompleted) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Could not load player registrations.</AlertDescription>
        </Alert>
      );
    }
    
    if(isCompleted) {
        return (
             <div className="space-y-6">
                <h3 className="font-semibold text-lg">Winners</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-col items-center gap-2 text-lg">
                                <Trophy className="h-8 w-8 text-yellow-500" />
                                1st Place
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold text-lg">{tournament.winners?.first?.username || 'N/A'}</p>
                            <p className="text-sm text-muted-foreground">Won {tournament.prizePoolFirst.toLocaleString()} coins</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-col items-center gap-2 text-lg">
                                <Medal className="h-8 w-8 text-gray-400" />
                                2nd Place
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold text-lg">{tournament.winners?.second?.username || 'N/A'}</p>
                            {tournament.winners?.second && (
                                <p className="text-sm text-muted-foreground">Won {tournament.prizePoolSecond.toLocaleString()} coins</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex flex-col items-center gap-2 text-lg">
                                <Crown className="h-8 w-8 text-orange-400" />
                                3rd Place
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="font-semibold text-lg">{tournament.winners?.third?.username || 'N/A'}</p>
                             {tournament.winners?.third && (
                                <p className="text-sm text-muted-foreground">Won {tournament.prizePoolThird.toLocaleString()} coins</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    if (!registrations || registrations.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No players have joined this tournament yet.</p>;
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Set Winners</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">1st Place (Required)</label>
              <Select value={firstPlace} onValueChange={setFirstPlace}>
                <SelectTrigger><SelectValue placeholder="Select 1st Place" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={`1-${p.id}`} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">2nd Place</label>
              <Select value={secondPlace} onValueChange={setSecondPlace}>
                <SelectTrigger><SelectValue placeholder="Select 2nd Place" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NA_VALUE}>N/A - No Winner</SelectItem>
                  {players.map(p => <SelectItem key={`2-${p.id}`} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">3rd Place</label>
              <Select value={thirdPlace} onValueChange={setThirdPlace}>
                <SelectTrigger><SelectValue placeholder="Select 3rd Place" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NA_VALUE}>N/A - No Winner</SelectItem>
                  {players.map(p => <SelectItem key={`3-${p.id}`} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Registered Players ({registrations.length} / {tournament.maxPlayers})</h3>
          <ScrollArea className="h-64 rounded-md border">
            <div className="p-4">
              <ul className="space-y-2">
                {registrations.map((reg, index) => (
                  <li key={reg.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {reg.teamName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                       {reg.registrationDate ? format(reg.registrationDate.toDate(), 'PPp') : 'Date missing'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage: {tournament.name}</DialogTitle>
          <DialogDescription>
            {isCompleted ? "Viewing results for this completed tournament." : "Select winners and view registered players."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">{renderContent()}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
          {!isCompleted && (
            <Button type="button" onClick={handleSubmitWinners} disabled={isSubmitting || isLoading}>
              {isSubmitting ? "Submitting..." : "Confirm & Pay Out Winners"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
