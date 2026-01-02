'use client';

import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Timestamp, collection, query, where, orderBy } from 'firebase/firestore';
import type { CoinRequest } from '@/lib/types';
import { useEffect, useState } from 'react';

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
  },
  denied: {
    icon: XCircle,
    label: 'Denied',
  },
};

const formatDate = (date: Timestamp | Date | undefined | null) => {
  if (!date) return 'N/A';
  if (date instanceof Timestamp) {
    return date.toDate().toLocaleDateString();
  }
  if (date instanceof Date) {
    return date.toLocaleDateString();
  }
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString();
  }
  return 'Invalid Date';
};

export function ApprovalStatusTable() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [allRequests, setAllRequests] = useState<WithId<CoinRequest>[] | null>(null);

  // Fetch Add Coin Requests
  const addRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "addCoinRequests"), where("userId", "==", user.uid), orderBy("requestDate", "desc"));
  }, [user, firestore]);
  const { data: addRequests, isLoading: addLoading, error: addError } = useCollection<CoinRequest>(addRequestsQuery);
  
  // Fetch Withdraw Coin Requests
  const withdrawRequestsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, "withdrawCoinRequests"), where("userId", "==", user.uid), orderBy("requestDate", "desc"));
  }, [user, firestore]);
  const { data: withdrawRequests, isLoading: withdrawLoading, error: withdrawError } = useCollection<CoinRequest>(withdrawRequestsQuery);

  // Combine and sort requests when they are fetched
  useEffect(() => {
    if (addRequests || withdrawRequests) {
      const combined = [...(addRequests || []), ...(withdrawRequests || [])];
      combined.sort((a, b) => (b.requestDate?.seconds || 0) - (a.requestDate?.seconds || 0));
      setAllRequests(combined);
    }
  }, [addRequests, withdrawRequests]);

  const isLoading = isUserLoading || addLoading || withdrawLoading;
  const error = addError || withdrawError;

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching History</AlertTitle>
        <AlertDescription>
          There was a problem loading your request history. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!allRequests || allRequests.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 border rounded-md">
        You have not made any coin requests yet.
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Coin Requests</CardTitle>
        <p className="text-sm text-muted-foreground">
          Here is the history of your add and withdraw requests.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Coins</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Request Date</TableHead>
              <TableHead>Decision Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allRequests.map((req) => {
              const statusInfo = statusConfig[req.status as keyof typeof statusConfig];
              return (
                <TableRow key={req.id}>
                  <TableCell className="capitalize font-medium">
                    {req.type}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'text-right font-semibold',
                      req.type === 'add' ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {req.type === 'add' ? '+' : '-'}
                    {req.amountCoins.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                           <Badge
                            className={cn(
                              'flex items-center gap-1.5 w-fit',
                              req.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 hover:bg-yellow-100',
                              req.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100',
                              req.status === 'denied' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-100'
                            )}
                          >
                            {statusInfo && <statusInfo.icon className="h-3.5 w-3.5" />}
                            {statusInfo ? statusInfo.label : req.status}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{statusInfo ? statusInfo.label : req.status}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {formatDate(req.requestDate)}
                  </TableCell>
                  <TableCell>
                    {formatDate(req.decisionDate)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
