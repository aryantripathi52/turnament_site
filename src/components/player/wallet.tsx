'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Gem } from 'lucide-react';
import { AddFundsForm } from './add-funds-form';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import type { CoinRequest as CoinRequestType } from '@/lib/types';
import { format } from 'date-fns';

export function Wallet() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [coinRequests, setCoinRequests] = useState<CoinRequestType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCoinRequests() {
      if (!user) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const q = query(
          collection(firestore, 'coinRequests'),
          where('userId', '==', user.uid),
          orderBy('requestDate', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CoinRequestType));
        setCoinRequests(requests);
      } catch (error) {
        console.error("Error fetching coin requests:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCoinRequests();
  }, [user, firestore]);

    const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'denied':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Helper to format Firestore Timestamp
  const formatDate = (timestamp: Timestamp | Date) => {
    if (!timestamp) return 'N/A';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return format(date, 'MMM d, yyyy');
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Add Coins</CardTitle>
          <CardDescription>
            Request to add coins to your wallet after payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
             <h4 className="text-sm font-medium">Request History</h4>
             <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Amount</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">Loading requests...</TableCell>
                            </TableRow>
                        )}
                        {!isLoading && coinRequests.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No requests found.</TableCell>
                            </TableRow>
                        )}
                        {!isLoading && coinRequests.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell>{request.amountCoins} coins</TableCell>
                            <TableCell>
                            {formatDate(request.requestDate as any)}
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant={getStatusVariant(request.status)} className="capitalize">{request.status}</Badge>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
             </div>
          </div>
        </CardContent>
        <CardFooter>
          <AddFundsForm isOpen={isAddFundsOpen} setIsOpen={setIsAddFundsOpen}>
            <Button className="w-full" onClick={() => setIsAddFundsOpen(true)}>
              <DollarSign className="mr-2 h-4 w-4" /> Add Funds
            </Button>
          </AddFundsForm>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Withdraw Coins</CardTitle>
          <CardDescription>
            Enter the amount of coins to withdraw to your bank account.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">This feature is coming soon. You will be able to withdraw your coins to real money.</p>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="secondary" disabled>
            <Gem className="mr-2 h-4 w-4" /> Withdraw (Coming Soon)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
