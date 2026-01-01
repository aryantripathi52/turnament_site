'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Gem } from 'lucide-react';
import { AddFundsForm } from './add-funds-form';
import { useState } from 'react';
import { Button } from '../ui/button';

export function Wallet() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add Coins</CardTitle>
          <CardDescription>
            Request to add coins to your wallet after payment.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Click the button below to open the funds request form. Follow the
            instructions in the form to complete your payment and submit your
            request for admin approval.
          </p>
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

    