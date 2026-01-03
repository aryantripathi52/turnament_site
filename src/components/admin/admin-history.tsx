'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowDown, ArrowUp, Trophy, Swords, ListOrdered } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AddCoinRequest, WithdrawCoinRequest, Tournament } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type HistoryItemType = 'Deposit' | 'Withdrawal' | 'Tournament Entry' | 'Tournament Prize';

type HistoryItem = {
  id: string;
  date: Timestamp | Date;
  type: HistoryItemType;
  amount: number;
  status: 'Pending' | 'Approved' | 'Denied' | 'Completed' | 'Live' | 'Upcoming';
  user: string;
};

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'Pp');
  }
  if (date instanceof Date) {
    return format(date, 'Pp');
  }
  return 'Invalid Date';
};

const statusColors: { [key in HistoryItem['status']]: string } = {
  Pending: 'bg-yellow-500/80',
  Approved: 'bg-green-500/80',
  Denied: 'bg-red-500/80',
  Completed: 'bg-gray-500/80',
  Live: 'bg-blue-500/80',
  Upcoming: 'bg-purple-500/80',
};

const typeConfig: { [key in HistoryItemType]: { icon: React.ElementType, color: string } } = {
  'Deposit': { icon: ArrowDown, color: 'text-green-500' },
  'Withdrawal': { icon: ArrowUp, color: 'text-red-500' },
  'Tournament Entry': { icon: Swords, color: 'text-blue-500' },
  'Tournament Prize': { icon: Trophy, color: 'text-yellow-500' },
};

export function AdminHistory() {
  const firestore = useFirestore();

  const addCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `addCoinRequests`), orderBy('requestDate', 'desc'));
  }, [firestore]);
  
  const withdrawCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, `withdrawCoinRequests`), orderBy('requestDate', 'desc'));
  }, [firestore]);

  const tournamentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tournaments'), orderBy('startDate', 'desc'));
  }, [firestore]);

  const { data: addRequests, isLoading: loadingAdd, error: addError } = useCollection<AddCoinRequest>(addCoinRequestsQuery);
  const { data: withdrawRequests, isLoading: loadingWithdraw, error: withdrawError } = useCollection<WithdrawCoinRequest>(withdrawCoinRequestsQuery);
  const { data: tournaments, isLoading: loadingTournaments, error: tournamentsError } = useCollection<Tournament>(tournamentsQuery);


  const allHistory = useMemo((): HistoryItem[] => {
    const history: HistoryItem[] = [];

    addRequests?.forEach(r => history.push({
      id: r.id,
      date: r.requestDate,
      type: 'Deposit',
      amount: r.amountCoins,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1) as HistoryItem['status'],
      user: r.username,
    }));

    withdrawRequests?.forEach(r => history.push({
      id: r.id,
      date: r.requestDate,
      type: 'Withdrawal',
      amount: -r.amountCoins,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1) as HistoryItem['status'],
      user: r.username,
    }));

    tournaments?.forEach(t => {
      // Create a record for the total entry fees collected
      if (t.registeredCount > 0 && t.entryFee > 0) {
        history.push({
          id: `entry-${t.id}`,
          date: t.startDate,
          type: 'Tournament Entry',
          amount: t.entryFee * t.registeredCount,
          status: t.status === 'upcoming' ? 'Upcoming' : t.status === 'live' ? 'Live' : 'Completed',
          user: `${t.name} (${t.registeredCount} players)`,
        });
      }

      // Create records for prize payouts
      if (t.status === 'completed' && t.winners) {
        if (t.winners.first) {
            history.push({
                id: `prize-1-${t.id}`,
                date: t.endDate,
                type: 'Tournament Prize',
                amount: -t.prizePoolFirst,
                status: 'Completed',
                user: t.winners.first.username,
            });
        }
        if (t.winners.second) {
            history.push({
                id: `prize-2-${t.id}`,
                date: t.endDate,
                type: 'Tournament Prize',
                amount: -t.prizePoolSecond,
                status: 'Completed',
                user: t.winners.second.username,
            });
        }
        if (t.winners.third) {
            history.push({
                id: `prize-3-${t.id}`,
                date: t.endDate,
                type: 'Tournament Prize',
                amount: -t.prizePoolThird,
                status: 'Completed',
                user: t.winners.third.username,
            });
        }
      }
    });

    return history.sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toMillis() : a.date.getTime();
        const dateB = b.date instanceof Timestamp ? b.date.toMillis() : b.date.getTime();
        return dateB - dateA;
    });

  }, [addRequests, withdrawRequests, tournaments]);

  const isLoading = loadingAdd || loadingWithdraw || loadingTournaments;
  const error = addError || withdrawError || tournamentsError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Global History</AlertTitle>
        <AlertDescription>
          There was a problem loading the transaction history. Please check permissions and try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!allHistory || allHistory.length === 0) {
    return (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
          <ListOrdered className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium">No Platform Activity Yet</h3>
          <p className="mt-1 text-sm">Transactions from all users will appear here once they occur.</p>
        </div>
    );
  }

  return (
    <Card className="border-yellow-500/20 shadow-[0_0_15px_-5px_theme(colors.yellow.500)]">
        <CardHeader>
            <CardTitle>Global Transaction History</CardTitle>
            <CardDescription>A complete log of all financial activities across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                 <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>User / Details</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allHistory.map((item) => {
                            const isPositive = item.amount > 0;
                            const TypeIcon = typeConfig[item.type].icon;
                            return (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <TypeIcon className={cn("h-4 w-4", typeConfig[item.type].color)} />
                                            <span className="font-medium">{item.type}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{item.user}</TableCell>
                                    <TableCell className="text-muted-foreground">{formatDate(item.date)}</TableCell>
                                    <TableCell>
                                        <Badge className={cn("capitalize text-white", statusColors[item.status])}>
                                            {item.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className={cn(
                                        "text-right font-mono font-bold",
                                        isPositive ? 'text-green-500' : 'text-red-500'
                                    )}>
                                        {isPositive ? '+' : ''}{item.amount.toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
    </Card>
  );
}
