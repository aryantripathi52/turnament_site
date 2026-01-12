
'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Medal, Trophy, Award, Flame, Star, ListOrdered } from 'lucide-react';
import type { PointsTableEntry } from '@/lib/types';
import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PointsTableProps {
  tournamentId: string;
}

export function PointsTable({ tournamentId }: PointsTableProps) {
  const firestore = useFirestore();

  const pointsTableQuery = useMemoFirebase(() => {
    if (!firestore || !tournamentId) return null;
    return query(collection(firestore, 'tournaments', tournamentId, 'pointsTable'));
  }, [firestore, tournamentId]);

  const { data, isLoading, error } = useCollection<PointsTableEntry>(pointsTableQuery);

  const sortedAndRankedData = useMemo(() => {
    if (!data) return [];
    return data
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }, [data]);

  const renderRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-400" />;
    return <span className="font-mono font-bold text-lg w-5 text-center">{rank}</span>;
  };

  if (isLoading) {
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
        <AlertTitle>Error Loading Points Table</AlertTitle>
        <AlertDescription>There was a problem loading the points table. Please try again later.</AlertDescription>
      </Alert>
    );
  }

  if (!sortedAndRankedData || sortedAndRankedData.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
        <ListOrdered className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-medium">Points Table Not Available</h3>
        <p className="mt-1 text-sm">The points table has not been updated for this tournament yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Rank</TableHead>
          <TableHead>Player</TableHead>
          <TableHead className="text-center">#1</TableHead>
          <TableHead className="text-center">Kills</TableHead>
          <TableHead className="text-right">Total Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedAndRankedData.map((entry) => (
          <TableRow key={entry.id} className="font-medium">
            <TableCell>
              <div className="flex items-center justify-center h-full">
                {renderRankIcon(entry.rank)}
              </div>
            </TableCell>
            <TableCell>{entry.playerName}</TableCell>
            <TableCell className="text-center font-semibold">{entry.wins}</TableCell>
            <TableCell className="text-center">{entry.kills}</TableCell>
            <TableCell className="text-right font-bold">{entry.totalPoints}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

    