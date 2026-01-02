'use client';

import { useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Clock, CheckCircle, XCircle, ArrowDown, ArrowUp, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import type { AddCoinRequest, WithdrawCoinRequest } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type CombinedRequest = (WithId<AddCoinRequest> | WithId<WithdrawCoinRequest>) & { collectionName: 'addCoinRequests' | 'withdrawCoinRequests'};


export function StaffCoinRequests() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const addCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'addCoinRequests'),
      where('status', '==', 'pending'),
      orderBy('requestDate', 'asc')
    );
  }, [firestore]);

  const withdrawCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'withdrawCoinRequests'),
      where('status', '==', 'pending'),
      orderBy('requestDate', 'asc')
    );
  }, [firestore]);

  const { data: addRequests, setData: setAddRequests, isLoading: loadingAdd, error: addError } = useCollection<AddCoinRequest>(addCoinRequestsQuery);
  const { data: withdrawRequests, setData: setWithdrawRequests, isLoading: loadingWithdraw, error: withdrawError } = useCollection<WithdrawCoinRequest>(withdrawCoinRequestsQuery);

  const allRequests = useMemo((): CombinedRequest[] => {
    const adds = addRequests?.map(r => ({ ...r, collectionName: 'addCoinRequests' as const })) || [];
    const withdraws = withdrawRequests?.map(r => ({ ...r, collectionName: 'withdrawCoinRequests' as const })) || [];
    return [...adds, ...withdraws].sort((a, b) => (a.requestDate as Timestamp).toMillis() - (b.requestDate as Timestamp).toMillis());
  }, [addRequests, withdrawRequests]);

  const isLoading = loadingAdd || loadingWithdraw;
  const error = addError || withdrawError;

  const handleDecision = async (request: CombinedRequest, decision: 'approved' | 'denied') => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database connection not found.' });
        return;
    }
    setProcessingId(request.id);

    const requestRef = doc(firestore, request.collectionName, request.id);
    const userRef = doc(firestore, 'users', request.userId);

    try {
        const batch = writeBatch(firestore);

        // Update the request status and decision date
        batch.update(requestRef, {
            status: decision,
            decisionDate: serverTimestamp(),
        });

        // If approved, adjust the user's coin balance
        if (decision === 'approved') {
            if (request.type === 'add') {
                batch.update(userRef, { coins: increment(request.amountCoins) });
            } else { // 'withdraw'
                batch.update(userRef, { coins: increment(-request.amountCoins) });
            }
        }

        await batch.commit();

        // Remove the processed request from the local state
        if (request.collectionName === 'addCoinRequests') {
            setAddRequests(prev => prev?.filter(r => r.id !== request.id) || null);
        } else {
            setWithdrawRequests(prev => prev?.filter(r => r.id !== request.id) || null);
        }

        toast({
            title: 'Success',
            description: `Request has been ${decision}.`,
        });

    } catch (e: any) {
        console.error('Failed to process request:', e);
        toast({
            variant: 'destructive',
            title: 'Processing Failed',
            description: e.message || 'An unexpected error occurred.',
        });
    } finally {
        setProcessingId(null);
    }
  }


  const renderRequests = () => {
    if (isLoading) {
      return (
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Requests</AlertTitle>
          <AlertDescription>
            There was a problem loading pending requests. Please check your permissions and try again.
          </AlertDescription>
        </Alert>
      );
    }

    if (!allRequests || allRequests.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
          <CheckCircle className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium">All Caught Up</h3>
          <p className="mt-1 text-sm">There are no pending coin requests to review.</p>
        </div>
      );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {allRequests.map((request) => {
            const isAdd = request.type === 'add';
            const isProcessing = processingId === request.id;
          return (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                        {isAdd ? <ArrowUp className="h-6 w-6 text-green-500" /> : <ArrowDown className="h-6 w-6 text-red-500" />}
                        {isAdd ? 'Add Request' : 'Withdraw Request'}
                    </CardTitle>
                    <Badge variant="outline">Pending</Badge>
                </div>
                 <CardDescription>
                    {format((request.requestDate as Timestamp).toDate(), 'PPp')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>User: <span className="font-semibold">{request.username}</span></span>
                </div>
                <div className="font-semibold text-lg">
                    Amount: {request.amountCoins.toLocaleString()} Coins
                </div>
                {isAdd && 'transactionId' in request && (
                     <div className="text-xs text-muted-foreground">
                        <p>Amount Paid: ₹{request.amountPaid.toLocaleString()}</p>
                        <p>Transaction ID: {request.transactionId}</p>
                    </div>
                )}
                 {!isAdd && 'withdrawalDetails' in request && (
                     <div className="text-sm">
                        <p className="font-medium">Withdrawal Details:</p>
                        <p className="text-muted-foreground whitespace-pre-wrap break-words">{request.withdrawalDetails}</p>
                    </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                    size="sm" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleDecision(request, 'approved')}
                    disabled={isProcessing}
                >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Approve'}
                </Button>
                <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => handleDecision(request, 'denied')}
                    disabled={isProcessing}
                >
                    <XCircle className="mr-2 h-4 w-4" />
                     {isProcessing ? 'Processing...' : 'Deny'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div>
        <CardHeader className="px-0">
            <CardTitle>Manage Coin Requests</CardTitle>
            <CardDescription>Review and process pending requests from players to add or withdraw coins.</CardDescription>
        </CardHeader>
        {renderRequests()}
    </div>
  );
}
