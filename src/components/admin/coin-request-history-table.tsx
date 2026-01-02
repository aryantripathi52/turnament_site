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
  // Fallback for serialized data that might just be a string
  if (typeof date === 'string') {
    return new Date(date).toLocaleDateString();
  }
  return 'Invalid Date';
};


export function CoinRequestHistoryTable() {
  const firestore = useFirestore();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query for all requests that are either 'approved' or 'denied'
    return query(
      collection(firestore, 'coinRequests'),
      where('status', 'in', ['approved', 'denied']),
      orderBy('requestDate', 'desc')
    );
  }, [firestore]);

  const { data: requests, isLoading, error } = useCollection<CoinRequest>(requestsQuery);


  if (isLoading) {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
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
          There was a problem loading the request history. Please check your connection and permissions.
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
