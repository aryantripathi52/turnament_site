'use client';

import { useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, query, Timestamp, doc, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { useCollection, WithId } from '@/firebase/firestore/use-collection';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Ban, ArrowDown, ArrowUp, User, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import type { AddCoinRequest, WithdrawCoinRequest, UserProfile } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useToast } from '@/hooks/use-toast';


type CombinedRequest = (WithId<AddCoinRequest> | WithId<WithdrawCoinRequest>) & { collectionName: 'addCoinRequests' | 'withdrawCoinRequests'};


export function StaffCoinRequests() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const addCoinRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'addCoinRequests'));
  }, [firestore]);

  const withdrawCoinRequestsQuery = useMemoFirebase(() => {
     if (!firestore) return null;
    return query(collection(firestore, 'withdrawCoinRequests'));
  }, [firestore]);

  const { data: addRequests, isLoading: loadingAdd, error: addError } = useCollection<AddCoinRequest>(addCoinRequestsQuery);
  const { data: withdrawRequests, isLoading: loadingWithdraw, error: withdrawError } = useCollection<WithdrawCoinRequest>(withdrawCoinRequestsQuery);

  const isLoading = loadingAdd || loadingWithdraw;
  const error = addError || withdrawError;

  useEffect(() => {
    if (error) {
      console.error("--- DETAILED PERMISSION ERROR ---");
      console.error("Error Code:", (error as any).code);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
      console.error("---------------------------------");
    }
  }, [error]);

  const handleEmergencyReset = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (e) {
      console.error("Sign out failed", e);
    }
    
    try {
      window.localStorage.clear();
      window.sessionStorage.clear();

      // This is a more robust way to handle IndexedDB deletion
      const dbs = await window.indexedDB.databases();
      dbs.forEach(db => {
        if (db.name) window.indexedDB.deleteDatabase(db.name);
      });
      console.log("All caches and DBs cleared.");

    } catch(e) {
        console.error("Error clearing storage:", e);
    } finally {
        window.location.href = "/login";
    }
  };


  const allRequests = useMemo((): CombinedRequest[] => {
    const adds: CombinedRequest[] = addRequests?.map(r => ({ ...r, collectionName: 'addCoinRequests' as const })) || [];
    const withdraws: CombinedRequest[] = withdrawRequests?.map(r => ({ ...r, collectionName: 'withdrawCoinRequests' as const })) || [];

    const combined = [...adds, ...withdraws].filter(r => r.status === 'pending');

    return combined.sort((a, b) => {
        const dateA = a.requestDate as Timestamp | undefined;
        const dateB = b.requestDate as Timestamp | undefined;
        if (!dateA || !dateB) return 0;
        return dateB.toMillis() - dateA.toMillis();
    });
  }, [addRequests, withdrawRequests]);

  
  const handleDecision = async (request: CombinedRequest, decision: 'approved' | 'denied') => {
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'Database connection not found.' });
        return;
    }
    setProcessingId(request.id);

    const requestRef = doc(firestore, request.collectionName, request.id);
    const userRef = doc(firestore, 'users', request.userId);
    const playerRequestRef = doc(firestore, `users/${request.userId}/${request.collectionName}`, request.id);

    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
                throw new Error("User profile not found.");
            }
            
            const userProfile = userDoc.data() as UserProfile;

            if (decision === 'approved' && request.type === 'withdraw' && userProfile.coins < request.amountCoins) {
                throw new Error("User has insufficient coins for this withdrawal.");
            }
            
            transaction.update(requestRef, {
                status: decision,
                decisionDate: serverTimestamp(),
            });
            
            transaction.update(playerRequestRef, {
                status: decision
            });

            if (decision === 'approved') {
                const coinChange = request.type === 'add' ? request.amountCoins : -request.amountCoins;
                transaction.update(userRef, { coins: increment(coinChange) });
            }
        });

        toast({
            title: `Request ${decision.charAt(0).toUpperCase() + decision.slice(1)}`,
            description: `The request for ${request.amountCoins.toLocaleString()} coins has been processed.`,
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
          <AlertTitle>Error: Missing or Insufficient Permissions</AlertTitle>
          <AlertDescription>
             Could not load coin requests. Your authentication token might be stale. Please use the 'CLEAR AUTH CACHE' button to force a full reset.
             <pre className="mt-2 text-xs bg-gray-800 p-2 rounded-md overflow-auto">
                Error Details: {(error as any).message || 'No details available.'}
             </pre>
          </AlertDescription>
        </Alert>
      );
    }

    if (!allRequests || allRequests.length === 0) {
      return (
        <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-md">
          <CheckCircle className="mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-medium">All Caught Up</h3>
          <p className="mt-1 text-sm">No pending coin requests found.</p>
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
                    {request.requestDate ? format((request.requestDate as Timestamp).toDate(), 'PPp') : 'Date missing'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                 <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">User ID: <span className="font-mono text-xs">{request.userId}</span></span>
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
        <div className="mb-6 p-4 border-2 border-destructive rounded-lg">
             <h3 className="font-bold text-destructive text-lg">Emergency Session Reset</h3>
             <p className="text-sm text-muted-foreground mb-4">If you are seeing permission errors after updating rules, click this button to clear all local authentication caches and force a fresh login.</p>
            <Button variant="destructive" size="lg" className="w-full" onClick={handleEmergencyReset}>
                CLEAR AUTH CACHE & RELOAD
            </Button>
        </div>
        <CardHeader className="px-0">
            <CardTitle>Manage Coin Requests</CardTitle>
            <CardDescription>Review and process pending requests from players to add or withdraw coins.</CardDescription>
        </CardHeader>
        {renderRequests()}
    </div>
  );
}
