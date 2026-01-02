
'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, writeBatch, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { CoinRequest } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CoinApprovalTableProps {
  requestType: 'add' | 'withdraw';
}

export function CoinApprovalTable({ requestType }: CoinApprovalTableProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const requestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'coinRequests'),
      where('type', '==', requestType),
      where('status', '==', 'pending')
    );
  }, [firestore, requestType]);

  const { data: requests, isLoading, error } = useCollection<CoinRequest>(requestsQuery);

   const onDecision = async (
    requestId: string,
    userId: string,
    amount: number,
    decision: 'approved' | 'denied'
  ) => {
     if (!firestore) {
        toast({
            variant: 'destructive',
            title: 'Operation Failed',
            description: 'Firestore is not available.',
        });
        return;
    }
    try {
        const requestRef = doc(firestore, 'coinRequests', requestId);

        if (decision === 'approved') {
            const userRef = doc(firestore, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                throw new Error(`User document not found for userId: ${userId}`);
            }

            const currentCoins = userDoc.data()?.coins ?? 0;
            let newBalance;

            if (requestType === 'add') {
                newBalance = currentCoins + amount;
            } else {
                newBalance = currentCoins - amount;
                if (newBalance < 0) {
                    throw new Error("Withdrawal amount exceeds user's balance.");
                }
            }
            
            const batch = writeBatch(firestore);
            batch.update(userRef, { coins: newBalance });
            batch.update(requestRef, {
                status: 'approved',
                decisionDate: new Date(),
            });
            await batch.commit();

        } else { // 'denied'
             await updateDoc(requestRef, {
                status: 'denied',
                decisionDate: new Date(),
            });
        }

        toast({
            title: `Request ${decision}`,
            description: `The coin request has been successfully ${decision}.`,
        });
    } catch (e: any) {
        console.error(`Failed to ${decision} request:`, e);
        toast({
            variant: 'destructive',
            title: 'Operation Failed',
            description: e.message || 'An unexpected error occurred.',
        });
    }
   };


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
        <AlertTitle>Error Fetching Requests</AlertTitle>
        <AlertDescription>
          There was a problem loading the coin requests. Please check your connection and permissions.
        </AlertDescription>
      </Alert>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-4 border rounded-md">
        No pending {requestType} requests.
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
                    <TableHead className="text-right">Coins</TableHead>
                    {requestType === 'add' && <TableHead className="text-right">Amount Paid</TableHead>}
                    {requestType === 'add' && <TableHead>Transaction ID</TableHead>}
                    {requestType === 'withdraw' && <TableHead>Withdrawal Details</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {requests.map((req) => (
                <TableRow key={req.id}>
                    <TableCell>{req.username}</TableCell>
                    <TableCell className="text-right font-medium">{req.amountCoins.toLocaleString()}</TableCell>
                    {requestType === 'add' && <TableCell className="text-right">${(req.amountPaid ?? 0).toFixed(2)}</TableCell>}
                    {requestType === 'add' && <TableCell><Badge variant="secondary">{req.transactionId}</Badge></TableCell>}
                    {requestType === 'withdraw' && <TableCell className="text-sm">{req.withdrawalDetails}</TableCell>}
                    <TableCell>{new Date(req.requestDate.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDecision(req.id, req.userId, req.amountCoins, 'approved')}
                        className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                        >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                        </Button>
                        <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDecision(req.id, req.userId, req.amountCoins, 'denied')}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                        <XCircle className="mr-2 h-4 w-4" />
                        Deny
                        </Button>
                    </div>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
}
