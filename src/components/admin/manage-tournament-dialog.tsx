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
import { collection, query, orderBy, doc, writeBatch, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import type { Tournament, Registration, UserProfile, WonTournament } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, User, Crown, Medal, Trophy } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';

interface ManageTournamentDialogProps {
  tournament: WithId<Tournament>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTournamentUpdate: (updatedTournament: WithId<Tournament>) => void;
}

export function ManageTournamentDialog({ tournament, isOpen, setIsOpen, onTournamentUpdate }: ManageTournamentDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [firstPlace, setFirstPlace] = useState<string | undefined>(tournament.winners?.first?.userId);
  const [secondPlace, setSecondPlace] = useState<string | undefined>(tournament.winners?.second?.userId);
  const [thirdPlace, setThirdPlace] = useState<string | undefined>(tournament.winners?.third?.userId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments', tournament.id, 'registrations'), orderBy('registrationDate', 'asc'));
  }, [firestore, tournament.id]);

  const { data: registrations, isLoading, error } = useCollection<Registration>(registrationsQuery);

  const players = useMemo(() => {
    return registrations?.map(reg => ({ id: reg.userId, name: reg.teamName })) || [];
  }, [registrations]);
  
  const isCompleted = tournament.status === 'completed';

  const getPlayerName = (userId: string | undefined) => players.find(p => p.id === userId)?.name || 'N/A';

  const handleSubmitWinners = async () => {
    if (!firstPlace || !secondPlace || !thirdPlace) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select winners for all three places.' });
      return;
    }
    if (new Set([firstPlace, secondPlace, thirdPlace]).size !== 3) {
      toast({ variant: 'destructive', title: 'Error', description: 'Each winner must be a unique player.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      
      const winners = {
        first: { userId: firstPlace, username: getPlayerName(firstPlace) },
        second: { userId: secondPlace, username: getPlayerName(secondPlace) },
        third: { userId: thirdPlace, username: getPlayerName(thirdPlace) },
      };

      // 1. Update tournament doc with winners and set status to 'completed'
      const tournamentRef = doc(firestore, 'tournaments', tournament.id);
      batch.update(tournamentRef, { winners, status: 'completed' });

      // 2. Pay out prizes and manage user subcollections
      const prizeMap = new Map([
          [firstPlace, { prize: tournament.prizePoolFirst, place: '1st' }],
          [secondPlace, { prize: tournament.prizePoolSecond, place: '2nd' }],
          [thirdPlace, { prize: tournament.prizePoolThird, place: '3rd' }],
      ]);

      for (const [userId, { prize, place }] of prizeMap.entries()) {
        const userRef = doc(firestore, 'users', userId);
        const joinedTournamentRef = doc(firestore, 'users', userId, 'joinedTournaments', tournament.id);
        const wonTournamentRef = doc(firestore, 'users', userId, 'wonTournaments', tournament.id);

        // Increment user's coin balance
        batch.update(userRef, { coins: increment(prize) });

        // Delete from 'joinedTournaments'
        batch.delete(joinedTournamentRef);
        
        // Add to 'wonTournaments'
        const wonTournamentData: Omit<WonTournament, 'id'> = {
            name: tournament.name,
            prizeWon: prize,
            place: place as WonTournament['place'],
            completionDate: serverTimestamp()
        };
        batch.set(wonTournamentRef, wonTournamentData);
      }

      await batch.commit();

      toast({ title: 'Success!', description: 'Winners have been set and prizes have been paid out.' });
      onTournamentUpdate({ ...tournament, status: 'completed', winners });
      setIsOpen(false);

    } catch (e) {
      console.error("Error setting winners:", e);
      toast({ variant: 'destructive', title: 'Operation Failed', description: 'Could not set winners. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
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

    if (!registrations || registrations.length === 0) {
      return <p className="text-center text-muted-foreground py-8">No players have joined this tournament yet.</p>;
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
                            <p className="font-semibold text-lg">{tournament.winners?.first?.username}</p>
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
                            <p className="font-semibold text-lg">{tournament.winners?.second?.username}</p>
                            <p className="text-sm text-muted-foreground">Won {tournament.prizePoolSecond.toLocaleString()} coins</p>
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
                            <p className="font-semibold text-lg">{tournament.winners?.third?.username}</p>
                            <p className="text-sm text-muted-foreground">Won {tournament.prizePoolThird.toLocaleString()} coins</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-2">Set Winners</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">1st Place</label>
              <Select value={firstPlace} onValueChange={setFirstPlace}>
                <SelectTrigger><SelectValue placeholder="Select 1st Place" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">2nd Place</label>
              <Select value={secondPlace} onValueChange={setSecondPlace}>
                <SelectTrigger><SelectValue placeholder="Select 2nd Place" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">3rd Place</label>
              <Select value={thirdPlace} onValueChange={setThirdPlace}>
                <SelectTrigger><SelectValue placeholder="Select 3rd Place" /></SelectTrigger>
                <SelectContent>
                  {players.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
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
                       {format(reg.registrationDate.toDate(), 'PPp')}
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
            <Button type="button" onClick={handleSubmitWinners} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Confirm & Pay Out Winners"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
