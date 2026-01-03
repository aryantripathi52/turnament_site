'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowDown, ArrowUp, Trophy, Swords, ListOrdered, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AddCoinRequest, WithdrawCoinRequest, Tournament } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '../ui/scroll-area';

type HistoryItemType = 'Deposit' | 'Withdrawal' | 'Tournament Entry' | 'Tournament Prize';
type HistoryItemStatus = 'Pending' | 'Approved' | 'Denied' | 'Completed' | 'Live' | 'Upcoming';
type FilterType = 'all' | 'deposit' | 'withdrawal' | 'payout';

type HistoryItem = {
  id: string;
  date: Timestamp | Date;
  type: HistoryItemType;
  amount: number;
  status: HistoryItemStatus;
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

const statusColors: { [key in HistoryItemStatus]: string } = {
  Pending: 'bg-yellow-500/80 hover:bg-yellow-500/70',
  Approved: 'bg-green-500/80 hover:bg-green-500/70',
  Denied: 'bg-red-500/80 hover:bg-red-500/70',
  Completed: 'bg-gray-500/80 hover:bg-gray-500/70',
  Live: 'bg-blue-500/80 hover:bg-blue-500/70',
  Upcoming: 'bg-purple-500/80 hover:bg-purple-500/70',
};

const typeConfig: { [key in HistoryItemType]: { icon: React.ElementType, color: string } } = {
  'Deposit': { icon: ArrowDown, color: 'text-green-500' },
  'Withdrawal': { icon: ArrowUp, color: 'text-red-500' },
  'Tournament Entry': { icon: Swords, color: 'text-blue-500' },
  'Tournament Prize': { icon: Trophy, color: 'text-yellow-500' },
};

export function AdminHistory() {
  const firestore = useFirestore();
  const [filter, setFilter] = useState<FilterType>('all');

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


  const filteredHistory = useMemo((): HistoryItem[] => {
    const history: HistoryItem[] = [];

    addRequests?.forEach(r => history.push({
      id: r.id,
      date: r.requestDate,
      type: 'Deposit',
      amount: r.amountCoins,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1) as HistoryItemStatus,
      user: r.username,
    }));

    withdrawRequests?.forEach(r => history.push({
      id: r.id,
      date: r.requestDate,
      type: 'Withdrawal',
      amount: -r.amountCoins,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1) as HistoryItemStatus,
      user: r.username,
    }));
    
    tournaments?.forEach(t => {
      // Include entry fees only for 'all' filter for a complete view
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
    
    const sorted = history.sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toMillis() : a.date.getTime();
        const dateB = b.date instanceof Timestamp ? b.date.toMillis() : b.date.getTime();
        return dateB - dateA;
    });

    if (filter === 'all') return sorted;
    if (filter === 'deposit') return sorted.filter(item => item.type === 'Deposit');
    if (filter === 'withdrawal') return sorted.filter(item => item.type === 'Withdrawal');
    if (filter === 'payout') return sorted.filter(item => item.type === 'Tournament Prize');

    return [];

  }, [addRequests, withdrawRequests, tournaments, filter]);

  const isLoading = loadingAdd || loadingWithdraw || loadingTournaments;
  const error = addError || withdrawError || tournamentsError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
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
  
  const FilterControl = () => (
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Select value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter by type..." />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="deposit">Manual Deposits</SelectItem>
                <SelectItem value="withdrawal">Withdrawals</SelectItem>
                <SelectItem value="payout">Tournament Payouts</SelectItem>
            </SelectContent>
        </Select>
      </div>
  );

  return (
    <Card className="border-yellow-500/20 shadow-[0_0_15px_-5px_theme(colors.yellow.500)]">
        <CardHeader>
            <CardTitle>View History</CardTitle>
            <CardDescription>A complete log of all financial activities across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
            <FilterControl />

            {filteredHistory.length === 0 ? (
                 <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
                    <ListOrdered className="mx-auto h-12 w-12" />
                    <h3 className="mt-4 text-lg font-medium">No Transactions Found</h3>
                    <p className="mt-1 text-sm">There are no records matching the current filter.</p>
                </div>
            ) : (
                <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-4">
                        {filteredHistory.map((item, index) => {
                            const isPositive = item.amount > 0;
                            const TypeIcon = typeConfig[item.type].icon;

                            return (
                                <div key={item.id} className="grid grid-cols-[auto,1fr,auto] items-center gap-4 p-4 rounded-md border bg-card-foreground/5 hover:bg-card-foreground/10 transition-colors">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold flex items-center gap-2">
                                            <TypeIcon className={cn("h-4 w-4", typeConfig[item.type].color)} />
                                            {item.user}
                                        </p>
                                        <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <p className={cn(
                                            "text-lg font-mono font-bold",
                                            isPositive ? 'text-green-500' : 'text-red-500'
                                        )}>
                                            {isPositive ? '+' : ''}{item.amount.toLocaleString()}
                                        </p>
                                        <Badge className={cn("capitalize text-white text-xs", statusColors[item.status])}>
                                            {item.status}
                                        </Badge>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            )}
        </CardContent>
    </Card>
  );
}
