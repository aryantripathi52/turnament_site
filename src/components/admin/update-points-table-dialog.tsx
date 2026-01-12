
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
import { Button } from '@/components/ui/button';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { collection, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import type { Tournament, Registration, PointsTableEntry } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, User, Award, Flame, Star, Trophy } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';

interface UpdatePointsTableDialogProps {
  tournament: WithId<Tournament>;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onTournamentUpdate: (updatedTournament: WithId<Tournament>) => void;
}

export function UpdatePointsTableDialog({ tournament, isOpen, setIsOpen, onTournamentUpdate }: UpdatePointsTableDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [pointsData, setPointsData] = useState<Record<string, { wins: number; kills: number; totalPoints: number }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registrationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments', tournament.id, 'registrations'), orderBy('registrationDate', 'asc'));
  }, [firestore, tournament.id]);

  const { data: registrations, isLoading, error } = useCollection<Registration>(registrationsQuery);

  const pointsTableQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments', tournament.id, 'pointsTable'));
  }, [firestore, tournament.id]);

  const { data: existingPoints, isLoading: isLoadingPoints } = useCollection<PointsTableEntry>(pointsTableQuery);

  useEffect(() => {
    if (existingPoints) {
      const initialData = existingPoints.reduce((acc, entry) => {
        acc[entry.playerName] = { wins: entry.wins, kills: entry.kills, totalPoints: entry.totalPoints };
        return acc;
      }, {} as Record<string, { wins: number; kills: number; totalPoints: number }>);
      setPointsData(initialData);
    }
  }, [existingPoints]);


  const handlePointChange = (playerName: string, field: 'wins' | 'kills' | 'totalPoints', value: string) => {
    const numericValue = parseInt(value, 10) || 0;
    setPointsData(prev => ({
      ...prev,
      [playerName]: {
        ...prev[playerName],
        [field]: numericValue
      }
    }));
  };
  
  const handleSubmit = async () => {
     if (!firestore || !registrations) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database not available.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const batch = writeBatch(firestore);
        
        registrations.forEach(reg => {
            const playerPoints = pointsData[reg.teamName] || { wins: 0, kills: 0, totalPoints: 0 };
            const entryRef = doc(firestore, 'tournaments', tournament.id, 'pointsTable', reg.userId);
            
            const entryData: Omit<PointsTableEntry, 'id' | 'rank'> = {
                playerName: reg.teamName,
                wins: playerPoints.wins,
                kills: playerPoints.kills,
                totalPoints: playerPoints.totalPoints
            };
            batch.set(entryRef, entryData, { merge: true });
        });
        
        await batch.commit();

        toast({ title: 'Success!', description: 'The points table has been updated.' });
        // No need to call onTournamentUpdate unless top-level tournament doc changes
        setIsOpen(false);
    } catch(e) {
        console.error("Error updating points table:", e);
        toast({ variant: 'destructive', title: 'Operation Failed', description: 'Could not update points table.' });
    } finally {
        setIsSubmitting(false);
    }

  }


  const renderContent = () => {
    if (isLoading || isLoadingPoints) {
      return (
        <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
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

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr,80px,80px,100px] gap-4 px-4 font-semibold text-sm text-muted-foreground">
                <div className="flex items-center gap-2"><User className="h-4 w-4" /> Player Name</div>
                <div className="flex items-center gap-2 justify-center"><Trophy className="h-4 w-4" /> #1</div>
                <div className="flex items-center gap-2 justify-center"><Flame className="h-4 w-4" /> # Kills</div>
                <div className="flex items-center gap-2 justify-center"><Star className="h-4 w-4" /> Total Points</div>
            </div>
            <ScrollArea className="h-96">
                <div className="space-y-2 p-1">
                {registrations.map(reg => (
                    <div key={reg.id} className="grid grid-cols-[1fr,80px,80px,100px] items-center gap-4 p-2 border rounded-md">
                        <p className="font-medium truncate">{reg.teamName}</p>
                        <Input 
                            type="number" 
                            className="text-center"
                            placeholder="0"
                            value={pointsData[reg.teamName]?.wins || ''}
                            onChange={(e) => handlePointChange(reg.teamName, 'wins', e.target.value)}
                        />
                        <Input 
                            type="number" 
                            className="text-center"
                            placeholder="0"
                            value={pointsData[reg.teamName]?.kills || ''}
                            onChange={(e) => handlePointChange(reg.teamName, 'kills', e.target.value)}
                        />
                        <Input 
                            type="number"
                            className="text-center font-bold"
                            placeholder="0"
                            value={pointsData[reg.teamName]?.totalPoints || ''}
                            onChange={(e) => handlePointChange(reg.teamName, 'totalPoints', e.target.value)}
                        />
                    </div>
                ))}
                </div>
            </ScrollArea>
        </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Update Points Table: {tournament.name}</DialogTitle>
          <DialogDescription>
            Enter the wins, kills, and total points for each player. Ranks will be calculated automatically based on total points.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">{renderContent()}</div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Points Table"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    