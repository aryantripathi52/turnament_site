'use client';

import { useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { AddCoinRequest, WithdrawCoinRequest } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

type CoinRequest = AddCoinRequest | WithdrawCoinRequest;

const formatDate = (date: any) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return format(date.toDate(), 'PPp');
  }
  return 'Invalid Date';
};

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'bg-yellow-500' },
  approved: { icon: CheckCircle, label: 'Approved', color: 'bg-green-500' },
  denied: { icon: XCircle, label: 'Denied', color: 'bg-red-500' },
};

export function RequestHistory() {
  const firestore = useFirestore();
  const { user } = useUser();

  const addCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'addCoinRequests'),
      where('userId', '==', user.uid),
      orderBy('requestDate', 'desc')
    );
  }, [firestore, user]);

  const withdrawCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'withdrawCoinRequests'),
      where('userId', '==', user.uid),
      orderBy('requestDate', 'desc')
    );
  }, [firestore, user]);

  const { data: addRequests, isLoading: loadingAdd, error: addError } = useCollection<AddCoinRequest>(addCoinRequestsQuery);
  const { data: withdrawRequests, isLoading: loadingWithdraw, error: withdrawError } = useCollection<WithdrawCoinRequest>(withdrawCoinRequestsQuery);

  const allRequests = useMemo(() => {
    const combined = [...(addRequests || []), ...(withdrawRequests || [])];
    return combined.sort((a, b) => {
        const dateA = a.requestDate as Timestamp;
        const dateB = b.requestDate as Timestamp;
        return dateB.toMillis() - dateA.toMillis();
    });
  }, [addRequests, withdrawRequests]);

  const isLoading = loadingAdd || loadingWithdraw;
  const error = addError || withdrawError;

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
          There was a problem loading your coin request history. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!allRequests || allRequests.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        <p>You have not made any coin requests yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allRequests.map((request, index) => {
        const isAddRequest = request.type === 'add';
        const statusInfo = statusConfig[request.status];
        return (
          <Card key={`${request.id}-${index}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <p className="font-semibold">
                  {isAddRequest ? 'Add Coins Request' : 'Withdraw Coins Request'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {formatDate(request.requestDate)}
                </p>
                <p className="text-sm font-bold">
                  Amount: {request.amountCoins.toLocaleString()} Coins
                </p>
              </div>
              <Badge className={cn("capitalize text-white text-xs", statusInfo.color)}>
                  <statusInfo.icon className="mr-1 h-3 w-3" />
                  {statusInfo.label}
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
