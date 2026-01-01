'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Gem } from 'lucide-react';

export function Wallet() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
            <CardTitle>Add Coins</CardTitle>
            <CardDescription>
                Select the amount of coins you want to add to your wallet.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="add-amount">Amount</Label>
                <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="add-amount" type="number" placeholder="10.00" className="pl-8"/>
                </div>
            </div>
                <p className="text-sm text-muted-foreground">1 USD = 100 Coins</p>
            </CardContent>
            <CardFooter>
            <Button className="w-full" disabled>Add Funds (Coming Soon)</Button>
            </CardFooter>
        </Card>
        <Card>
            <CardHeader>
            <CardTitle>Withdraw Coins</CardTitle>
            <CardDescription>
                Enter the amount of coins to withdraw to your bank account.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <div className="relative">
                <Gem className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="withdraw-amount" type="number" placeholder="1000" className="pl-8" />
                </div>
            </div>
            <p className="text-sm text-muted-foreground">100 Coins = 1 USD</p>
            </CardContent>
            <CardFooter>
            <Button className="w-full" variant="secondary" disabled>Withdraw (Coming Soon)</Button>
            </CardFooter>
        </Card>
    </div>
  );
}
