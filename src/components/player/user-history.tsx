'use client';

import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, CheckCircle, XCircle, ArrowDown, ArrowUp, Trophy, Swords, History as HistoryIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PlayerAddCoinRequest, PlayerWithdrawCoinRequest, JoinedTournament, WonTournament } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type HistoryItemType = 'Deposit' | 'Withdrawal' | 'Tournament Entry' | 'Tournament Prize';

type HistoryItem = {
  id: string;
  date: Timestamp;
  type: HistoryItemType;
  amount: number;
  status: 'Pending' | 'Approved' | 'Denied' | 'Completed';
  title?: string;
};

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'PPp');
  }
  return 'Invalid Date';
};

const statusConfig: { [key in HistoryItem['status']]: { icon: React.ElementType, color: string } } = {
  Pending: { icon: Clock, color: 'bg-yellow-500' },
  Approved: { icon: CheckCircle, color: 'bg-green-500' },
  Denied: { icon: XCircle, color: 'bg-red-500' },
  Completed: { icon: CheckCircle, color: 'bg-gray-500' },
};

const typeConfig: { [key in HistoryItemType]: { icon: React.ElementType, color: string } } = {
  'Deposit': { icon: ArrowDown, color: 'text-green-500' },
  'Withdrawal': { icon: ArrowUp, color: 'text-red-500' },
  'Tournament Entry': { icon: Swords, color: 'text-red-500' },
  'Tournament Prize': { icon: Trophy, color: 'text-yellow-500' },
};


export function UserHistory() {
  const firestore = useFirestore();
  const { user } = useUser();

  const addCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/addCoinRequests`), orderBy('requestDate', 'desc'));
  }, [firestore, user]);
  
  const withdrawCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/withdrawCoinRequests`), orderBy('requestDate', 'desc'));
  }, [firestore, user]);
  
  const wonTournamentQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/wonTournaments`), orderBy('completionDate', 'desc'));
  }, [firestore, user]);

  const joinedTournamentQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, `users/${user.uid}/joinedTournaments`), orderBy('startDate', 'desc'));
  }, [firestore, user]);


  const { data: addRequests, isLoading: loadingAdd, error: addError } = useCollection<PlayerAddCoinRequest>(addCoinRequestsQuery);
  const { data: withdrawRequests, isLoading: loadingWithdraw, error: withdrawError } = useCollection<PlayerWithdrawCoinRequest>(withdrawCoinRequestsQuery);
  const { data: wonTournaments, isLoading: loadingWon, error: wonError } = useCollection<WonTournament>(wonTournamentQuery);
  const { data: joinedTournaments, isLoading: loadingJoined, error: joinedError } = useCollection<JoinedTournament>(joinedTournamentQuery);

  const allHistory = useMemo((): HistoryItem[] => {
    const history: HistoryItem[] = [];

    addRequests?.forEach(r => history.push({
      id: r.id,
      date: r.requestDate,
      type: 'Deposit',
      amount: r.amountCoins,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1) as HistoryItem['status'],
    }));

    withdrawRequests?.forEach(r => history.push({
      id: r.id,
      date: r.requestDate,
      type: 'Withdrawal',
      amount: -r.amountCoins,
      status: r.status.charAt(0).toUpperCase() + r.status.slice(1) as HistoryItem['status'],
    }));

    joinedTournaments?.forEach(r => history.push({
        id: `joined-${r.id}`,
        date: r.startDate,
        type: 'Tournament Entry',
        amount: -r.entryFee,
        status: 'Completed',
        title: r.name
    }));
    
    wonTournaments?.forEach(r => history.push({
        id: `won-${r.id}`,
        date: r.completionDate,
        type: 'Tournament Prize',
        amount: r.prizeWon,
        status: 'Completed',
        title: `${r.name} (${r.place} Place)`
    }));

    return history.sort((a, b) => {
        const dateA = a.date instanceof Timestamp ? a.date.toMillis() : 0;
        const dateB = b.date instanceof Timestamp ? b.date.toMillis() : 0;
        return dateB - dateA;
    });

  }, [addRequests, withdrawRequests, wonTournaments, joinedTournaments]);

  const isLoading = loadingAdd || loadingWithdraw || loadingWon || loadingJoined;
  const error = addError || withdrawError || wonError || joinedError;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>
          There was a problem loading your transaction history. Please try again.
          <pre className="mt-2 text-xs bg-gray-800 p-2 rounded-md overflow-auto">
            Error Details: {(error as any).message || 'No details available.'}
          </pre>
        </AlertDescription>
      </Alert>
    );
  }

  if (!allHistory || allHistory.length === 0) {
    return (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
          <HistoryIcon className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium">No Activity Yet</h3>
          <p className="mt-1 text-sm">Your transaction history will appear here once you start.</p>
        </div>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
            {allHistory.map((item) => {
                const isPositive = item.amount > 0;
                const statusInfo = statusConfig[item.status];
                const typeInfo = typeConfig[item.type];
                return (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                        <div className={cn('p-2 rounded-full bg-muted', typeInfo.color)}>
                            <typeInfo.icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <p className="font-semibold">{item.title || item.type}</p>
                            <p className="text-xs text-muted-foreground">
                                {formatDate(item.date)}
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                         <p className={cn(
                            "font-bold text-lg",
                            isPositive ? 'text-green-500' : 'text-red-500'
                         )}>
                            {isPositive ? '+' : ''}{item.amount.toLocaleString()} Coins
                        </p>
                        <Badge className={cn("capitalize text-white text-xs", statusInfo.color)}>
                            <statusInfo.icon className="mr-1 h-3 w-3" />
                            {item.status}
                        </Badge>
                    </div>
                </div>
                );
            })}
            </div>
        </CardContent>
    </Card>
  );
}
