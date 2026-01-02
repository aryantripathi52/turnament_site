'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Calendar, Users, Trophy, Gem, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { Tournament, Category } from '@/lib/types';
import { Button } from '../ui/button';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  // Timestamps from Firestore might be objects with seconds and nanoseconds
  if (date.seconds) {
    return format(new Date(date.seconds * 1000), 'PPp');
  }
  // Or they might already be Date objects
  if (date instanceof Date) {
    return format(date, 'PPp');
  }
  return 'Invalid Date';
};

export function PlayerTournamentList() {
  const firestore = useFirestore();

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

  const isLoading = isLoadingTournaments || isLoadingCategories;
  const error = tournamentsError || categoriesError;

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

  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        <p>No tournaments are available at the moment.</p>
        <p className="text-sm mt-2">Please check back later!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tournaments.map((tournament) => (
        <Card key={tournament.id} className="flex flex-col">
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
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                        Starts: <span className="font-semibold">{formatDate(tournament.startDate)}</span>
                    </span>
                </div>
             </div>
          </CardContent>
          <CardFooter>
             <Button size="sm" className="w-full" disabled>
                <ShieldCheck className="mr-2 h-4 w-4" />
                Enter Tournament
             </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
