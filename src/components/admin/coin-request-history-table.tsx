'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { CoinRequest } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase/auth/use-user';

const statusConfig = {
  approved: {
    icon: CheckCircle,
    color: 'bg-green-500',
    label: 'Approved',
  },
  denied: {
    icon: XCircle,
    color: 'bg-red-500',
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


export function CoinRequestHistoryTable() {
  const firestore = useFirestore();
  const { profile } = useUser();

  const addRequestsQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== 'admin') return null;
    return query(
      collection(firestore, 'addCoinRequests'),
      where('status', 'in', ['approved', 'denied']),
      orderBy('requestDate', 'desc')
    );
  }, [firestore, profile]);

  const withdrawRequestsQuery = useMemoFirebase(() => {
    if (!firestore || profile?.role !== 'admin') return null;
    return query(
      collection(firestore, 'withdrawCoinRequests'),
      where('status', 'in', ['approved', 'denied']),
      orderBy('requestDate', 'desc')
    );
  }, [firestore, profile]);

  const { data: addRequests, isLoading: isLoadingAdd, error: addError } = useCollection<CoinRequest>(addRequestsQuery);
  const { data: withdrawRequests, isLoading: isLoadingWithdraw, error: withdrawError } = useCollection<CoinRequest>(withdrawRequestsQuery);
  
  const [requests, setRequests] = useState<CoinRequest[]>([]);
  const isLoading = isLoadingAdd || isLoadingWithdraw;
  const error = addError || withdrawError;

  useEffect(() => {
     if (profile?.role !== 'admin') {
      setRequests([]);
      return;
    }
    const combined = [...(addRequests || []), ...(withdrawRequests || [])];
    combined.sort((a, b) => (b.requestDate?.seconds || 0) - (a.requestDate?.seconds || 0));
    setRequests(combined);
  }, [addRequests, withdrawRequests, profile]);


  if (isLoading && profile?.role === 'admin') {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
    );
  }

  if (error && profile?.role === 'admin') {
     return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Fetching History</AlertTitle>
        <AlertDescription>
          There was a problem loading the request history. Your account may not have the required admin permissions.
        </AlertDescription>
      </Alert>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-md">
        No approved or denied requests found.
      </div>
    );
  }

  return (
    <Card>
        <CardContent className="p-0">
            <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Coins</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Decision Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((req) => {
                  const statusInfo = statusConfig[req.status as 'approved' | 'denied'];
                  return (
                    <TableRow key={req.id}>
                        <TableCell>{req.username}</TableCell>
                        <TableCell className="capitalize">{req.type}</TableCell>
                        <TableCell className={cn(
                          'text-right font-semibold',
                          req.type === 'add' ? 'text-green-500' : 'text-red-500'
                        )}>
                            {req.type === 'add' ? '+' : '-'}{req.amountCoins.toLocaleString()}
                        </TableCell>
                         <TableCell>
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                <Badge
                                    className={cn(
                                    'flex items-center gap-1.5 w-fit',
                                    req.status === 'approved' && 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 hover:bg-green-100',
                                    req.status === 'denied' && 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 hover:bg-red-100'
                                    )}
                                >
                                    <statusInfo.icon className="h-3.5 w-3.5" />
                                    {statusInfo.label}
                                </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{statusInfo.label}</p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        </TableCell>
                        <TableCell>{formatDate(req.requestDate)}</TableCell>
                        <TableCell>{formatDate(req.decisionDate)}</TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
