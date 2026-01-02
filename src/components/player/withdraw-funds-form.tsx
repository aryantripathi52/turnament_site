'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { collection, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { Textarea } from '../ui/textarea';
import type { WithdrawCoinRequest, PlayerWithdrawCoinRequest } from '@/lib/types';


const formSchema = z.object({
  amountCoins: z.coerce.number().positive({ message: 'Please enter a valid amount.' }),
  withdrawalDetails: z.string().min(10, { message: 'Please provide sufficient details for the withdrawal (at least 10 characters).' }),
});

interface WithdrawFundsFormProps {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function WithdrawFundsForm({ children, isOpen, setIsOpen }: WithdrawFundsFormProps) {
  const firestore = useFirestore();
  const { user, profile } = useUser();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amountCoins: 0,
      withdrawalDetails: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !profile || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to submit a request.',
      });
      return;
    }
    
    if (profile.coins < values.amountCoins) {
        toast({
            variant: 'destructive',
            title: 'Insufficient Coins',
            description: 'You do not have enough coins to make this withdrawal.',
        });
        return;
    }


    try {
      const batch = writeBatch(firestore);
      const requestDate = serverTimestamp();

      // 1. Create request in the global collection for admin review
      const globalRequestRef = doc(collection(firestore, 'withdrawCoinRequests'));
      const globalRequestData: Omit<WithdrawCoinRequest, 'id'> = {
        userId: user.uid,
        username: profile.username,
        type: 'withdraw',
        amountCoins: values.amountCoins,
        withdrawalDetails: values.withdrawalDetails,
        status: 'pending',
        requestDate: requestDate,
        decisionDate: null,
      };
      batch.set(globalRequestRef, globalRequestData);

      // 2. Create a denormalized copy in the user's private subcollection
      const userRequestRef = doc(collection(firestore, `users/${user.uid}/withdrawCoinRequests`), globalRequestRef.id);
      const userRequestData: Omit<PlayerWithdrawCoinRequest, 'id'> = {
         amountCoins: values.amountCoins,
         status: 'pending',
         requestDate: requestDate,
      };
      batch.set(userRequestRef, userRequestData);
      
      await batch.commit();


      toast({
        title: 'Request Submitted',
        description: 'Your request to withdraw coins has been sent for approval. You can track its status in your History tab.',
      });
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error('Error submitting coin request:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'An error occurred while submitting your request. Please try again.',
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Coins</DialogTitle>
          <DialogDescription>
            Enter the amount of coins to withdraw (1 Coin = ₹1) and your payment details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountCoins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coins to Withdraw</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="withdrawalDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Withdrawal Details</FormLabel>
                   <FormControl>
                    <Textarea
                      placeholder="Enter your UPI ID, bank account number, etc."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
