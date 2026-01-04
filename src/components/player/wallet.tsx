'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DollarSign, Coins, Info } from 'lucide-react';
import { AddFundsForm } from './add-funds-form';
import { useState } from 'react';
import { Button } from '../ui/button';
import { WithdrawFundsForm } from './withdraw-funds-form';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export function Wallet() {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawFundsOpen, setIsWithdrawFundsOpen] = useState(false);

  return (
    <div className="space-y-6">
       <Alert className="bg-primary/10 border-primary/50 text-primary-foreground">
        <Info className="h-4 w-4 text-primary" />
        <AlertTitle className="font-semibold text-primary">Please Note</AlertTitle>
        <AlertDescription className="text-primary/90">
          Payment approvals can take up to 12 hours. Kindly wait for the review process to complete. For a seamless tournament experience, please add coins at least 12 hours in advance.
        </AlertDescription>
      </Alert>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Add Coins</CardTitle>
            <CardDescription>
              Request to add coins to your wallet after payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">Submit a request to add coins to your wallet. Admins will review your request after you have made a payment.</p>
          </CardContent>
          <CardFooter>
            <AddFundsForm isOpen={isAddFundsOpen} setIsOpen={setIsAddFundsOpen}>
              <Button className="w-full" onClick={() => setIsAddFundsOpen(true)}>
                <DollarSign className="mr-2 h-4 w-4" /> Add Funds
              </Button>
            </AddFundsForm>
          </CardFooter>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Withdraw Coins</CardTitle>
            <CardDescription>
              Request to withdraw coins to your bank account (1 Coin = ₹1).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">Submit a request to convert your coins to real money. Admins will review and process your request.</p>
          </CardContent>
          <CardFooter>
            <WithdrawFundsForm isOpen={isWithdrawFundsOpen} setIsOpen={setIsWithdrawFundsOpen}>
              <Button className="w-full" onClick={() => setIsWithdrawFundsOpen(true)}>
                <Coins className="mr-2 h-4 w-4" /> Withdraw Coins
              </Button>
            </WithdrawFundsForm>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
