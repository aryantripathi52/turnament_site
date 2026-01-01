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
import { useState } from 'react';
import { Button } from '../ui/button';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { CoinRequest as CoinRequestType } from '@/lib/types';
import { format } from 'date-fns';

export function Wallet() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const coinRequestsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(
      collection(firestore, 'coinRequests'),
      where('userId', '==', user.uid),
      orderBy('requestDate', 'desc')
    );
  }, [firestore, user]);

  const { data: coinRequests, isLoading } = useCollection<CoinRequestType>(coinRequestsQuery);

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
                        {!isLoading && coinRequests?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center">No requests found.</TableCell>
                            </TableRow>
                        )}
                        {coinRequests?.map((request) => (
                        <TableRow key={request.id}>
                            <TableCell>{request.amountCoins} coins</TableCell>
                            <TableCell>
                            {request.requestDate
                                ? format(new Date(request.requestDate.seconds * 1000), 'MMM d, yyyy')
                                : 'N/A'}
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
